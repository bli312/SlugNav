# Spike: Showing Class Locations on a Map

**Issue:** #13 · **Owner:** Dan · **Sprint:** 1 · **Time box:** ~2 hours  
**Status:** Recommendation ready for Sprint 2 planning

> Items marked **(verify)** are worth a quick check before Sprint 2 starts.

## Question

Which map should SlugNav use in our Expo/React Native app, and how do we put a class's building (and room) on it?

## Options compared

| | Google Maps | OpenStreetMap + Leaflet (WebView) | MapLibre (native) |
|---|---|---|---|
| **Cost** | Free tier, then paid. Team research: routing gets billed after about 1,000 uses **(verify)** | Free and open data | Free and open source |
| **Setup** | API key and billing account | Already working on `main` (Ian's foundation) | Native module, likely needs an Expo development build **(verify)** |
| **Campus data** | Good base map, no classroom detail | UCSC buildings and paths mapped by the community **(verify coverage)** | Same OSM data as Leaflet |
| **Routing (Sprint 2)** | Google Routes API (paid after free tier) | openrouteservice, OSM-based, free tier **(verify daily limits)** | openrouteservice |
| **Offline (story 4.3)** | Limited | Possible with cached tiles, more work in a WebView | Built-in offline packs |
| **Effort** | Medium | Lowest, already done | Higher |

## Recommendation

1. **Keep OpenStreetMap + Leaflet**, which is already on `main`. It's free, needs no billing account, and map rendering is already proven by Ian's foundation work.
2. **Use openrouteservice for routing** in Sprint 2 instead of Google, to avoid usage costs (from Ian's research).
3. **Revisit MapLibre later** only if WebView performance or offline mode (story 4.3) becomes a problem.
4. **Tile hosting:** OpenStreetMap's public tile servers are fine for development, but a released app should use a tile provider, because OSM's usage policy limits heavy use **(verify the policy)**.

## How a class gets onto the map

1. **Class data** gives a building name and room, e.g. "Thimann Lecture 003". This comes from the data spike (#11).
2. **Building coordinates** come from our own `buildings` table (name, aliases, latitude, longitude). We seed it from OSM's UCSC building data, or by hand for the roughly 50 buildings with classrooms.
3. **Name matching:** catalog building names often differ from map names, so each building gets a list of aliases.
4. **The pin:** class → building row → marker on the map, with the room number in the marker's popup.
5. **Rooms maps can't identify:** for now, show the building pin plus the room number. Indoor floor plans stay in the backlog.

## Proof of concept

Ian's OpenStreetMap + Leaflet foundation already renders the campus map on `main`, so map rendering is not a risk. The remaining unknown is adding markers from our own data, which is the first Sprint 2 task.

## Proposed Sprint 2 tasks

- [ ] `buildings` table seeded with classroom buildings and coordinates (2 SP)
- [ ] Match class building names to `buildings` rows, including aliases (2 SP)
- [ ] Show a class's location as a pin on the map from the class list (2 SP)
- [ ] Pick a tile provider for release (1 SP, spike)

## Open questions

- Is the location text in the public class catalog consistent enough to match automatically? (Depends on the data spike, #11.)
- SC Metro's API (found by Ian) fits bus story 4.1 and is out of scope for this spike.
