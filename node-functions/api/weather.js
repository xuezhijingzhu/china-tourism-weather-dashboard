const normalizeRegionName = (value) =>
  value.trim().replace(/(省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区)$/u, '');

async function fetchJson(env, path, searchParams) {
  const apiHost = env.QWEATHER_API_HOST || '';
  const apiKey = env.QWEATHER_KEY || '';

  if (!apiHost || !apiKey) {
    throw new Error('QWEATHER_API_HOST or QWEATHER_KEY is missing.');
  }

  const url = new URL(path, `https://${apiHost}`);
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'X-QW-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`QWeather request failed with HTTP ${response.status}`);
  }

  return response.json();
}

function pickBestLocation(city, locations) {
  const normalizedCity = normalizeRegionName(city);

  const exactCity = locations.find(
    (item) => item.country === '中国' && normalizeRegionName(item.name) === normalizedCity,
  );

  if (exactCity) {
    return exactCity;
  }

  const chinaMatch = locations.find((item) => item.country === '中国');
  return chinaMatch || locations[0] || null;
}

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const city = (requestUrl.searchParams.get('city') || '').trim();

  if (!city) {
    return new Response(JSON.stringify({ message: 'Missing required query: city' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  try {
    const locationData = await fetchJson(context.env, '/geo/v2/city/lookup', {
      location: city,
      range: 'cn',
      number: '10',
      lang: 'zh',
    });

    if (locationData.code !== '200' || !locationData.location?.length) {
      return new Response(JSON.stringify({ message: `No weather data found for city: ${city}` }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    const location = pickBestLocation(city, locationData.location);
    const weatherData = await fetchJson(context.env, '/v7/weather/now', {
      location: location.id,
      lang: 'zh',
      unit: 'm',
    });

    if (weatherData.code !== '200' || !weatherData.now) {
      return new Response(JSON.stringify({ message: `No weather data found for city: ${city}` }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    return new Response(
      JSON.stringify({
        city: location.name,
        province: normalizeRegionName(location.adm1),
        temperature: Number(weatherData.now.temp),
        condition: weatherData.now.text,
        humidity: Number(weatherData.now.humidity),
        windDirection: weatherData.now.windDir,
        windPower: `${weatherData.now.windScale}级`,
        updatedAt: weatherData.now.obsTime,
        isMock: false,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }
}
