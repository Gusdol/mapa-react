import { useContext, useEffect, useReducer } from "react";
import { AnySourceData, LngLatBounds, Map, Marker, Popup } from "mapbox-gl";
import { mapReducer } from "./mapReducer";
import { MapContext } from "./MapContext";
import { PlacesContext } from "../";
import { directionsApi } from "../../api";
import { DirectionsResponse } from "../../interfaces/directions";

export interface MapState {
  isMapReady: boolean;
  map?: Map;
  markers: Marker[];
}

const INITIAL_STATE: MapState = {
  isMapReady: false,
  map: undefined,
  markers: [],
};

interface Props {
  children: JSX.Element | JSX.Element[];
}

export const MapProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);
  const { places } = useContext(PlacesContext);

  useEffect(() => {
    //borrar todos los marcadores anteriores del mapa con el metodo remove.
    state.markers.forEach((marker) => marker.remove());
    const newMarkers: Marker[] = [];

    //crear nuevos marcadores
    for (const place of places) {
      const [lng, lat] = place.center;
      const popup = new Popup().setHTML(`
        <h6>${place.text_es}</h6>
        <p>${place.place_name_es}</p>
      `);

      const newMarker = new Marker()
        .setPopup(popup)
        .setLngLat([lng, lat])
        .addTo(state.map!); // con el signo de admiracion decimos que tiene un valor

      newMarkers.push(newMarker);

      // limpiar polyline
      dispatch({ type: "setMarkers", payload: newMarkers });
    }
  }, [places]);

  const setMap = (map: Map) => {
    // window.info es igual al popup. setHtml para inyectar codigo html
    const myLocationPopup = new Popup().setHTML(`
        <h4>Aqui estoy</h4>
        <p>en algún lugar</p>
      `);
    new Marker({
      color: "#61DAFB",
    })
      // la latitud y longitud del usuario
      .setLngLat(map.getCenter())
      .setPopup(myLocationPopup)
      // a donde quiero instalar el marcador
      .addTo(map);

    dispatch({ type: "setMap", payload: map });
  };

  const getRouteBetweenPoints = async (
    start: [number, number],
    end: [number, number]
  ) => {
    const resp = await directionsApi.get<DirectionsResponse>(
      `/${start.join(",")};${end.join(",")}`
    );
    const { distance, duration, geometry } = resp.data.routes[0];
    const { coordinates: coords } = geometry;

    let kms = distance / 1000;
    kms = Math.round(kms * 100);
    kms /= 100;

    const minutes = Math.floor(duration / 60);
    console.log({ kms, minutes });

    const bounds = new LngLatBounds(start, start);

    for (const coord of coords) {
      const newCoord: [number, number] = [coord[0], coord[1]];
      bounds.extend(newCoord);
    }
    // fitBounds para ver correctamente los polylines de un punto a otro
    state.map?.fitBounds(bounds, {
      padding: 200,
    });

    //polyline
    //como luce una polyline
    const sourceData: AnySourceData = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coords,
            },
          },
        ],
      },
    };

    // remover polyline si existe
    if (state.map?.getLayer("RouteString")) {
      state.map.removeLayer("RouteString");
      state.map.removeSource("RouteString");
    }

    //agregar nuestra data solo se puede tener una polyline pero se puede agregar mas con diferentes ids.
    state.map?.addSource("RouteString", sourceData);
    //configurar el color, etc.
    state.map?.addLayer({
      id: "RouteString",
      type: "line",
      source: "RouteString",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#888",
        "line-width": 6,
      },
    });
  };

  return (
    <MapContext.Provider
      value={{
        ...state,

        //Methods
        setMap,
        getRouteBetweenPoints,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
