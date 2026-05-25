import React from "react";

// Define the component props
interface CountryMapProps {
  mapColor?: string;
}

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  return (
    <div
      style={{
        width: "100%",
        height: 240,
        borderRadius: 8,
        border: "1px solid #E5E7EB",
        background: `linear-gradient(180deg, ${mapColor || "#D0D5DD"} 0%, #F8FAFC 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748B",
        fontSize: 13,
      }}
    >
      Mapa indisponível nesta versão
    </div>
  );
};

export default CountryMap;
