const categoryWordTree = {
    "Inmuebles": {
        "Alquiler": "property.rental",
        "Venta": "property.sale"
    },
    "Comercio": {
        "Mayorista": {
            "Precio": "wholesale.price",
            "Ubicación": "wholesale.location",
            "Altas": "wholesale.start",
            "Bajas": "wholesale.stop",
        },
        "Minorista": {
            "Precio": "retail.price",
            "Ubicación": "retail.location",
            "Altas": "retail.start",
            "Bajas": "retail.stop",
        },
        "Chino": {
            "Precio": "chinese.price",
            "Ubicación": "chinese.location",
            "Altas": "chinese.start",
            "Bajas": "chinese.stop",
        }
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
