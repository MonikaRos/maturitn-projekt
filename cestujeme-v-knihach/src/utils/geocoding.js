export const getCoordinates = async (city, country) => {
  try {
    console.log(`Hľadám súradnice pre: ${city}, ${country}`);
    
    
    
    const query = encodeURIComponent(`${city}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CestujemeVKnihach/1.0' // n to aby nominatim fungoval
      }
    });
    
    if (!response.ok) {
      throw new Error('Geocoding API neodpovedá');
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      console.warn(' Nenašli sa súradnice, použijem predvolené');
      // ak sa nenájdu súradnice dajú sa tieto (stred europy)
      return {
        success: false,
        coordinates: [50.0, 10.0],
        message: 'Miesto sa nenašlo, použité predvolené súradnice'
      };
    }
    
    const location = data[0];
    const coordinates = [parseFloat(location.lat), parseFloat(location.lon)];
    
    console.log(`Súradnice nájdené:`, coordinates);
    
    return {
      success: true,
      coordinates: coordinates,
      displayName: location.display_name 
    };
    
  } catch (error) {
    console.error(' Chyba pri získavaní súradníc:', error);
    
    
    return {
      success: false,
      coordinates: [50.0, 10.0],
      message: 'Chyba pri hľadaní súradníc: ' + error.message
    };
  }
};

export const validateCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }
  
  const [lat, lon] = coordinates;
  
  // Latitude musí byť medzi -90 a 90
  // Longitude musí byť medzi -180 a 180
  return (
    typeof lat === 'number' && 
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
};

export const formatCoordinates = (coordinates) => {
  if (!validateCoordinates(coordinates)) {
    return 'Neznáme súradnice';
  }
  
  const [lat, lon] = coordinates;
  return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
};