var $ = require('jquery')
var Backbone = require('backbone')

var LayoutView = require('app/views/layout')
var NavigationView = require('app/views/navigation')
var ServersView = require('app/views/servers/list')
var LogsListView = require('app/views/logs/list')
var ModsListView = require('app/views/mods/list')
var ServerView = require('app/views/servers/view')
var Logs = require('app/collections/logs')
var Mods = require('app/collections/mods')
var Settings = require('app/models/settings')
var Servers = require('app/collections/servers')

var $body = $('body')
var mods = new Mods()
var settings = new Settings()
var servers = new Servers()
var layoutView = new LayoutView({ el: $body }).render()

module.exports = Backbone.Router.extend({

  routes: {
    logs: 'logs',
    mods: 'mods',
    'servers/:id': 'server',
    '': 'home'
  },

  initialize: function () {
    layoutView.navigation.show(new NavigationView({ settings: settings, servers: servers }))

    var initialized = false

    /* global io */
    var socket = io.connect()
    socket.on('mods', function (_mods) {
      mods.set(_mods)
    })
    socket.on('servers', function (_servers) {
      servers.set(_servers)

      if (!initialized) {
        initialized = true
        Backbone.history.start()
      }
    })
    socket.on('settings', function (_settings) {
      settings.set(_settings)
    })
  },

  home: function () {
    layoutView.content.show(new ServersView({ collection: servers }))
  },

  logs: function () {
    var logs = new Logs()
    logs.fetch()
    layoutView.content.show(new LogsListView({ collection: logs }))
  },

  mods: function () {
    layoutView.content.show(new ModsListView({ collection: mods }))
  },

  server: function (id) {
    var server = servers.get(id)
    if (server) {
      layoutView.content.show(new ServerView({
        model: server,
        mods: mods
      }))
    } else {
      this.navigate('#', true)
    }
  }

})
