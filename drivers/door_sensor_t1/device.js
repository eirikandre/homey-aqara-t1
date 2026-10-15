'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

// The sensor only exposes batteryVoltage (in 100 mV units) and does not
// support attribute reporting for it, so we poll it while the device is awake.
const BATTERY_VOLTAGE_MIN = 2.5;
const BATTERY_VOLTAGE_MAX = 3.0;
const BATTERY_READ_INTERVAL_MS = 12 * 60 * 60 * 1000;

class DoorSensorT1Device extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.printNode();

    const endpoint = zclNode.endpoints[1];
    const iasZone = endpoint.clusters[CLUSTER.IAS_ZONE.NAME];
    const powerConfiguration = endpoint.clusters[CLUSTER.POWER_CONFIGURATION.NAME];

    this.lastBatteryRead = 0;

    iasZone.onZoneStatusChangeNotification = ({ zoneStatus }) => {
      this.onZoneStatus(zoneStatus);
    };

    iasZone.onZoneEnrollRequest = () => {
      iasZone.zoneEnrollResponse({ enrollResponseCode: 'success', zoneId: 10 })
        .catch((err) => this.error('Failed to send zoneEnrollResponse', err));
    };

    iasZone.on('attr.zoneStatus', (zoneStatus) => this.onZoneStatus(zoneStatus));
    powerConfiguration.on('attr.batteryVoltage', (value) => this.onBatteryVoltage(value));

    // The device is awake right after pairing, so fetch the initial state.
    if (this.isFirstInit()) {
      await this.readZoneStatus(iasZone);
      await this.readBatteryVoltage();
    }
  }

  onZoneStatus(zoneStatus) {
    if (!zoneStatus) return;
    const open = Boolean(zoneStatus.alarm1);
    this.log('Contact', open ? 'open' : 'closed');
    this.setCapabilityValue('alarm_contact', open).catch(this.error);

    // A status change means the device is awake; use the chance to read the battery.
    if (Date.now() - this.lastBatteryRead > BATTERY_READ_INTERVAL_MS) {
      this.readBatteryVoltage().catch(this.error);
    }
  }

  async readZoneStatus(iasZone) {
    try {
      const { zoneStatus } = await iasZone.readAttributes(['zoneStatus']);
      this.onZoneStatus(zoneStatus);
    } catch (err) {
      this.error('Failed to read zoneStatus', err);
    }
  }

  async readBatteryVoltage() {
    this.lastBatteryRead = Date.now();
    try {
      const { batteryVoltage } = await this.zclNode.endpoints[1]
        .clusters[CLUSTER.POWER_CONFIGURATION.NAME]
        .readAttributes(['batteryVoltage']);
      this.onBatteryVoltage(batteryVoltage);
    } catch (err) {
      this.error('Failed to read batteryVoltage', err);
    }
  }

  onBatteryVoltage(value) {
    if (typeof value !== 'number' || value === 0 || value === 0xFF) return;
    const voltage = value / 10;
    const ratio = (voltage - BATTERY_VOLTAGE_MIN) / (BATTERY_VOLTAGE_MAX - BATTERY_VOLTAGE_MIN);
    const percentage = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);

    this.log('Battery', `${voltage} V`, `${percentage} %`);
    this.setCapabilityValue('measure_battery', percentage).catch(this.error);
    this.setCapabilityValue('alarm_battery', percentage <= 20).catch(this.error);
  }

}

module.exports = DoorSensorT1Device;
