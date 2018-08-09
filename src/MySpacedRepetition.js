var humanInterval = require('human-interval')

const defaultConfig = {
  'new': '5 minutes',
  'bad': '5 minutes',
  'fresh': '1 day',
  'average': '3 days',
  'old': '14 days'
}

class SpacedRepetition {
  constructor (date, state, config) {
    this.config = config || defaultConfig
    this.state = state || 'new'
    this.date = date
  }

  nextDate (grade) {
    const getNextTime = () => {
      let time = this.config[this.state] || 0
      return humanInterval(time)
    }

    var newstate = null;

    switch (grade) {
      case 'good':
        if (this.state === 'bad') {
          newstate = 'new'
        } else if (this.state === 'average') {
          newstate = 'old'
        } else if (this.state === 'old') {
          newstate = 'never'
        } else {
          newstate = 'average'
        }
        break
      case 'ok':
        if (this.state === 'bad') {
          newstate = 'new'
        } else {
          newstate = 'fresh'
        }
        break
      default:
        newstate = 'bad'
    }

    var newdate = new Date(this.date.getTime() + getNextTime())
    return new SpacedRepetition(newdate,newstate,this.config);
  }

  ok () {
    return this.nextDate('ok')
  }

  good () {
    return this.nextDate('good')
  }

  bad () {
    return this.nextDate('bad')
  }
}

module.exports = SpacedRepetition
