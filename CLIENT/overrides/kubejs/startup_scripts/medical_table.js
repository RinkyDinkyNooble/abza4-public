// priority: 10
// The medical system's numbers: regions and their afflictions, reagents, vaccines and antigens, resting, the death
// penalty and the blood pack
global.ABZA_MEDICAL = {
    "regions": {
        "abza:tier1": 1,
        "abza:tier2": 2,
        "abza:tier3": 3,
        "abza:cinder": 5,
        "abza:eden": 6,
        "abza:umbra": 7,
        "abza:interloper": 8
    },
    "afflictions": {
        "1": {
            "effect": "abza:affliction_t1",
            "name": "Grave Fever",
            "region": "the Tier 1 region",
            "colour": 10212186
        },
        "2": {
            "effect": "abza:affliction_t2",
            "name": "Whispering Chill",
            "region": "the Tier 2 region",
            "colour": 7329512
        },
        "3": {
            "effect": "abza:affliction_t3",
            "name": "Brood Fever",
            "region": "the Tier 3 region",
            "colour": 14725184
        },
        "5": {
            "effect": "abza:affliction_t5",
            "name": "Ashen Gaze",
            "region": "the Tier 5 region",
            "colour": 14708778
        },
        "6": {
            "effect": "abza:affliction_t6",
            "name": "Flesh Hunger",
            "region": "the Tier 6 region",
            "colour": 5223306
        },
        "7": {
            "effect": "abza:affliction_t7",
            "name": "Umbral Blight",
            "region": "the Tier 7 region",
            "colour": 9417945
        },
        "8": {
            "effect": "abza:affliction_t8",
            "name": "Spore Lung",
            "region": "the Tier 8 region",
            "colour": 11022918
        }
    },
    "vaccines": {
        "abza:vaccine_t1": {
            "region": 1,
            "name": "Grave Fever Vaccine",
            "colour": 10212186
        },
        "abza:vaccine_t2": {
            "region": 2,
            "name": "Whispering Chill Vaccine",
            "colour": 7329512
        },
        "abza:vaccine_t3": {
            "region": 3,
            "name": "Brood Fever Vaccine",
            "colour": 14725184
        },
        "abza:vaccine_t5": {
            "region": 5,
            "name": "Ashen Gaze Vaccine",
            "colour": 14708778
        },
        "abza:vaccine_t6": {
            "region": 6,
            "name": "Flesh Hunger Vaccine",
            "colour": 5223306
        },
        "abza:vaccine_t7": {
            "region": 7,
            "name": "Umbral Blight Vaccine",
            "colour": 9417945
        },
        "abza:vaccine_t8": {
            "region": 8,
            "name": "Spore Lung Vaccine",
            "colour": 11022918
        }
    },
    "reagents": {
        "abza:rendered_fat": {
            "name": "Rendered Fat",
            "colour": 15260064
        },
        "abza:chitin_gel": {
            "name": "Chitin Gel",
            "colour": 13164634
        },
        "abza:cryo_gel": {
            "name": "Cryo Gel",
            "colour": 10478576
        },
        "abza:ocular_serum": {
            "name": "Ocular Serum",
            "colour": 14708778
        },
        "abza:flesh_culture": {
            "name": "Flesh Culture",
            "colour": 12603469
        },
        "abza:crimson_serum": {
            "name": "Crimson Serum",
            "colour": 10361650
        },
        "abza:mycelial_extract": {
            "name": "Mycelial Extract",
            "colour": 9072560
        }
    },
    "antigens": {
        "abza:antigen_t1": {
            "name": "Grave Virus",
            "colour": 10212186
        },
        "abza:antigen_t2": {
            "name": "Whisper Prion",
            "colour": 7329512
        },
        "abza:antigen_t3": {
            "name": "Brood Larvae",
            "colour": 14725184
        },
        "abza:antigen_t5": {
            "name": "eYe Virus",
            "colour": 14708778
        },
        "abza:antigen_t6": {
            "name": "Flesh Virus",
            "colour": 5223306
        },
        "abza:antigen_t7": {
            "name": "Phayriosis Parasite",
            "colour": 9417945
        },
        "abza:antigen_t8": {
            "name": "Mycelium Spores",
            "colour": 11022918
        }
    },
    "rest": {
        "interval": 80,
        "food": 18,
        "share": 0.02,
        "exhaustion": 2.4
    },
    "death": {
        "share": 0.05,
        "minimum": 1,
        "floor": 0.5,
        "restore": 0.1,
        "heal": 0.25
    },
    "bloodPack": "abza:blood_pack"
}
