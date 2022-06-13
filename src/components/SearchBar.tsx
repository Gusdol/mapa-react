import { ChangeEvent, useContext, useRef } from "react";
import { PlacesContext } from "../context";
import { SearchResults } from "./";

export const SearchBar = () => {
  const { searchPlacesByTerm } = useContext(PlacesContext);

  //saber que debounceRef es un timeout
  const debounceRef = useRef<NodeJS.Timeout>();

  //debounce manual
  const onQueryChanged = (event: ChangeEvent<HTMLInputElement>) => {
    //limpiar si tiene un valor el debounceRef
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // despues de hacer la limpieza se vuelve a crear
    debounceRef.current = setTimeout(() => {
      // buscar o ejecutar consulta
      searchPlacesByTerm(event.target.value);
    }, 1000);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        className="form-control"
        placeholder="Buscar lugar..."
        onChange={onQueryChanged}
      />
      <SearchResults />
    </div>
  );
};
