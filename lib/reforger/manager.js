var events = require('events')
var fs = require('fs')

var Server = require('./server')

var filePath = 'servers.json'

var Manager = function (config, logs) {
  this.config = config
  this.logs = logs
  this.serversArr = []
  this.serversHash = {}
}

Manager.prototype = new events.EventEmitter()

Manager.prototype.addServer = function (options) {
  var server = this._addServer(options)
  this.save()
  return server
}

Manager.prototype.removeServer = function (id) {
  var server = this.serversHash[id]

  if (!server) {
    return {}
  }

  var index = this.serversArr.indexOf(server)
  if (index > -1) {
    this.serversArr.splice(index, 1)
  }
  this.save()

  if (server.pid) {
    server.stop()
  }

  return server
}

Manager.prototype._addServer = function (data) {
  var server = new Server(this.config, this.logs, data)
  this.serversArr.push(server)
  this.serversArr.sort(function (a, b) {
    return a.title.localeCompare(b.title)
  })
  this.serversHash[server.id] = server

  var self = this
  var save = function () {
    self.save()
  }
  var statusChanged = function () {
    self.emit('servers')
  }
  server.on('save', save)
  server.on('state', statusChanged)

  return server
}

Manager.prototype.getServer = function (id) {
  return this.serversHash[id]
}

Manager.prototype.getServers = function () {
  return this.serversArr
}

Manager.prototype.load = function () {
  var self = this

  fs.readFile(filePath, function (err, data) {
    if (err) {
      console.log('Could not load any existing servers configuration, starting fresh')
      return
    }

    try {
      JSON.parse(data).forEach(function (server) {
        self._addServer(server)
      })
    } catch (e) {
      console.error('Manager load error: ' + e)
    }

    self.getServers().map(function (server) {
      if (server.auto_start) {
        server.start()
      }
    })
  })
}

Manager.prototype.save = function () {
  var data = []
  var self = this

  this.serversArr.sort(function (a, b) {
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  })

  this.serversHash = {}
  this.serversArr.forEach(function (server) {
    data.push({
      admin_password: server.admin_password,
      auto_start: server.auto_start,
      battle_eye: server.battle_eye,
      dedicatedServerId: server.dedicatedServerId,
      max_players: server.max_players,
      missions: server.missions,
      mods: server.mods,
      password: server.password,
      port: server.port,
      title: server.title
    })

    self.serversHash[server.id] = server
  })

  fs.writeFile(filePath, JSON.stringify(data), function (err) {
    if (err) {
      console.error('Manager save error: ' + err)
    } else {
      self.emit('servers')
    }
  })
}

module.exports = Manager