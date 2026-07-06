// Bij benadering hoofdstad-coordinaten van de 48 WK 2026-deelnemers, puur voor
// het plaatsen van gloeiende punten op de 3D-aardbol (Hero3D). Geen precisie nodig.
export const WORLD_TEAMS = [
  { name: "Mexico", lat: 19.4, lon: -99.1 },
  { name: "Zuid-Afrika", lat: -25.7, lon: 28.2 },
  { name: "Zuid-Korea", lat: 37.6, lon: 127.0 },
  { name: "Tsjechie", lat: 50.1, lon: 14.4 },
  { name: "Canada", lat: 45.4, lon: -75.7 },
  { name: "Bosnie-Herz.", lat: 43.9, lon: 18.4 },
  { name: "Qatar", lat: 25.3, lon: 51.5 },
  { name: "Zwitserland", lat: 46.9, lon: 7.4 },
  { name: "Brazilie", lat: -15.8, lon: -47.9 },
  { name: "Marokko", lat: 34.0, lon: -6.8 },
  { name: "Haiti", lat: 18.5, lon: -72.3 },
  { name: "Schotland", lat: 55.95, lon: -3.2 },
  { name: "USA", lat: 38.9, lon: -77.0 },
  { name: "Paraguay", lat: -25.3, lon: -57.6 },
  { name: "Australie", lat: -35.3, lon: 149.1 },
  { name: "Turkije", lat: 39.9, lon: 32.9 },
  { name: "Duitsland", lat: 52.5, lon: 13.4 },
  { name: "Curacao", lat: 12.1, lon: -68.9 },
  { name: "Ivoorkust", lat: 6.8, lon: -5.3 },
  { name: "Ecuador", lat: -0.2, lon: -78.5 },
  { name: "Nederland", lat: 52.4, lon: 4.9 },
  { name: "Japan", lat: 35.7, lon: 139.7 },
  { name: "Zweden", lat: 59.3, lon: 18.1 },
  { name: "Tunesie", lat: 36.8, lon: 10.2 },
  { name: "Belgie", lat: 50.8, lon: 4.4 },
  { name: "Egypte", lat: 30.0, lon: 31.2 },
  { name: "Iran", lat: 35.7, lon: 51.4 },
  { name: "Nieuw-Zeeland", lat: -41.3, lon: 174.8 },
  { name: "Spanje", lat: 40.4, lon: -3.7 },
  { name: "Kaapverdie", lat: 14.9, lon: -23.5 },
  { name: "Saoedi-Arabie", lat: 24.7, lon: 46.7 },
  { name: "Uruguay", lat: -34.9, lon: -56.2 },
  { name: "Frankrijk", lat: 48.9, lon: 2.3 },
  { name: "Senegal", lat: 14.7, lon: -17.4 },
  { name: "Irak", lat: 33.3, lon: 44.4 },
  { name: "Noorwegen", lat: 59.9, lon: 10.7 },
  { name: "Argentinie", lat: -34.6, lon: -58.4 },
  { name: "Algerije", lat: 36.8, lon: 3.1 },
  { name: "Oostenrijk", lat: 48.2, lon: 16.4 },
  { name: "Jordanie", lat: 31.9, lon: 35.9 },
  { name: "Portugal", lat: 38.7, lon: -9.1 },
  { name: "DR Congo", lat: -4.4, lon: 15.3 },
  { name: "Oezbekistan", lat: 41.3, lon: 69.2 },
  { name: "Colombia", lat: 4.7, lon: -74.1 },
  { name: "Engeland", lat: 51.5, lon: -0.1 },
  { name: "Kroatie", lat: 45.8, lon: 16.0 },
  { name: "Ghana", lat: 5.6, lon: -0.2 },
  { name: "Panama", lat: 9.0, lon: -79.5 },
];

// lat/lon (graden) -> xyz op een bol met straal r.
export function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}
