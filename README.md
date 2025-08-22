# Family Dashboard

Code for family dashboard. Always-on 10 inch e-ink screen, updated daily.

![Photo](image.jpg)

## Requirements

- Inkplate 10
- Docker server, network accessible from Inkplate device
- PirateWeather API key

## Useful Links

- [Pirate Weather Doc](http://docs.pirateweather.net/en/latest/)
- [Inkplate](https://inkplate.readthedocs.io/en/latest/)
- [Inkplate Arduino Setup](https://github.com/SolderedElectronics/Inkplate-Arduino-library#setting-up-inkplate-in-arduino-ide)
- [Inkplate 10 examples](https://github.com/SolderedElectronics/Inkplate-Arduino-library/tree/master/examples/Inkplate10)
- [node-html-to-image](https://github.com/frinyvonnick/node-html-to-image)

## Components

### Client: Inkplate 10 device

- This component fetch the current dashboard from the server and displays the info as-is on e-ink display.
- The device use wifi to access the home network.
- Client code is in client/ folder.
- Arduino C code. Use Arduino IDE to build and deploy to device.

### Dashboard server

- Generate the dashboard image on a schedule. Serve this image to the client device when requested.
- Server code is in server/ folder.
- It is a basic node.js application.
- The weather is fetched from the pirateweather api. See server/accessors/pirateweather.js
- The events data is fetched from an iCal url. See server/accessors/ical.js
- The dashboard image is generated using an html template. See server/accessors/template

## Development

### Client

Arduino IDE.

Dependencies:

- Inkplate arduino libraries.
- Inkplate board definition.

### Server

Environment variables:

```
PIRATEWEATHER_APIKEY=***
WEATHER_CACHE_DURATION_MINUTES=120
WEATHER_AM_HOUR=8
WEATHER_PM_HOUR=14
LAT=***
LON=***
ICAL_URL=https://p35-caldav.icloud.com/published/2/***
PORT=8080
```

Put those values in .ENV file to configure your server.

```bash
cd server
npm install
node .
```

Now, you can make changes to the template and see the result in a browser at [http://localhost:8080/generatePage](http://localhost:8080/generatePage).

I used NSSM to host the node app as a windows service on my home server box.

#### Running server with Docker

From the project root, build the Docker image with:

```powershell
docker build -t your-image-name ./server
```

Replace `your-image-name` with a name you choose for your image.

To run the server in Docker with proper environment variables (since `.env` is not included in the image) and map a local folder to the container's output directory, use the following command (replace the local path as needed):

```powershell
docker run \
	-v C:\my\local\output:/usr/src/app/output \
	-p 8080:8080 \
	-e PIRATEWEATHER_APIKEY=your_api_key \
	-e WEATHER_CACHE_DURATION_MINUTES=120 \
	-e WEATHER_AM_HOUR=8 \
	-e WEATHER_PM_HOUR=14 \
	-e LAT=your_latitude \
	-e LON=your_longitude \
	-e ICAL_URL=https://your.ical.url \
	your-image-name
```

Replace the values as needed for your environment.

This will map your local `C:\my\local\output` folder to the container's `/usr/src/app/output` directory, allowing you to access generated files on your host machine for easier troubleshooting or archiving needs.

## Troubleshooting

### Arduino IDE

``` 
Compilation error: Error resolving FQBN: getting build properties for board Inkplate_Boards:esp32:Inkplate10: invalid option 'PSRAM'

Compilation error: Error resolving FQBN: getting build properties for board Inkplate_Boards:esp32:Inkplate10: invalid option 'CPUFreq'
```

1. Delete inkplate library
2. Delete inkplate board
3. Install inkplate board
4. Compile. Missing file error should happear.
5. Install inkplate library
6. Compile... it should work now.
