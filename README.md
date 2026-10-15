# Aqara Door & Window Sensor T1 for Homey Pro

A small Homey app that adds support for the **Aqara Door & Window Sensor T1** (`lumi.magnet.agl02`) on Homey Pro (2023).

## Why this app exists

The official Aqara app for Homey does not work properly with this sensor. It lets you pair the sensor, but once it is added Homey never shows the **contact alarm** (open/closed) or the **battery status**. That makes the sensor useless for flows and alarms.

This app is built specifically for the T1 sensor and fixes both problems.

## Features

- **Contact alarm** (`alarm_contact`): shows whether the door/window is open or closed.
- **Battery level** (`measure_battery`): battery percentage, calculated from the battery voltage.
- **Low battery alarm** (`alarm_battery`): triggers when the battery is at or below 20 %.

## How it works

The T1 differs from older Aqara sensors in a few ways, which is likely why the original app fails:

- **Open/closed state** is reported through the standard Zigbee IAS Zone cluster (`0x0500`). The app enrolls the sensor in the IAS zone and listens for zone status change notifications.
- **Battery** is only exposed as `batteryVoltage` in the Power Configuration cluster, and the sensor does not support attribute reporting for it. The app therefore reads the voltage when the sensor is awake (right after pairing and when the contact state changes, at most every 12 hours) and converts 2.5–3.0 V into 0–100 %.

## Installation

Requires the [Homey CLI](https://apps.developer.homey.app/the-basics/getting-started/homey-cli).

```bash
npm install
homey app install
```

## Pairing

1. In Homey, add a new device and choose **Aqara T1 → Door & Window Sensor T1**.
2. Press and hold the reset button on the sensor for about 5 seconds until the blue light blinks.
3. Keep the sensor close to Homey until pairing completes.

If the sensor was previously added with another app, remove it from Homey first.

## Notes

- The battery value may take a while to appear after pairing, as the sensor sleeps most of the time and is only read when it wakes up (e.g. when the door is opened or closed).
- Battery type: CR1632.

## License

MIT
