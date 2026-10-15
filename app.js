'use strict';

const Homey = require('homey');

class AqaraT1App extends Homey.App {

  async onInit() {
    this.log('Aqara T1 app has been initialized');
  }

}

module.exports = AqaraT1App;
