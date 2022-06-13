import { useContext } from "react";
import { MapView, ReactLogo, SearchBar } from "../components";
import { BtnMyLocation } from "../components";
import { PlacesContext } from "../context";

export const Home = () => {
  const { isLoading } = useContext(PlacesContext);

  return (
    <div>
      <MapView />

      {!isLoading && (
        <>
          <BtnMyLocation />
          <ReactLogo />
          <SearchBar />
        </>
      )}
    </div>
  );
};
