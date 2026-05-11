const categoryWordTree = {
    "Inmuebles": {
        "Alquiler": "property.rental",
        "Venta": "property.sale"
    },
    "Comercio": {
        "Mayorista": {
            "Nacional": {
                "Precio": "wholesale.national.price",
                "Ubicación": "wholesale.national.location",
                "Altas": "wholesale.national.start",
                "Bajas": "wholesale.national.stop",
            },
            "Regional": {
                "Precio": "wholesale.regional.price",
                "Ubicación": "wholesale.regional.location",
                "Altas": "wholesale.regional.start",
                "Bajas": "wholesale.regional.stop",
            },
        },
        "Minorista": {
            "Supermercado": {
                "Precio": "retail.supermarket.price",
                "Ubicación": "retail.supermarket.location",
                "Altas": "retail.supermarket.start",
                "Bajas": "retail.supermarket.stop",
            },
            "Boliche": {
                "Precio": "retail.momanddad.price",
                "Ubicación": "retail.momanddad.location",
                "Altas": "retail.momanddad.start",
                "Bajas": "retail.momanddad.stop",
            },
        },
    },
    "Vía Pública": {
        "Calles": {
            "Bache": "street.pothole",
            "Sin asfalto": "street.unpaved"
        },
        "Veredas": {
            "Rota": "sidewalk.broken",
            "Sin vereda": "sidewalk.none"
        }
    },
    "Servicios": {
        "Iluminación": {
            "Rota": "lighting.broken",
            "Insuficiente": "lighting.insufficient",
            "Sin luminaria": "lighting.none"
        },
        "Agua": {
            "Pérdida": "water.loss",
            "Sin agua": "water.none"
        }
    }
};
