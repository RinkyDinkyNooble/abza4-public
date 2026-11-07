// NPC skins and names for /spawnNPC
//
// ABZA_NPC_SKINS: each pool's skin textures, by gender (a 64x64 or 64x32 player skin each)
// ABZA_NPC_NAMES: first names by gender, from many cultures; none is a named character's (NPCs go by one name)
// ABZA_NPC_CAST: each named character as /spawnNPC's cast option places it (options given beside it win)
// A skin file ending in _slim.png is drawn with slim arms
const ABZA_NPC_SKINS = {
    // Prospero's crew, guards and guards for hire
    prospero: {
        male: [
            'abza_npcs:textures/entity/prospero/prospero_1.png',
            'abza_npcs:textures/entity/prospero/prospero_2.png',
            'abza_npcs:textures/entity/prospero/prospero_3.png',
            'abza_npcs:textures/entity/prospero/prospero_4_slim.png'
        ],
        female: []
    },
    // Survivors: field traders, civilians, guards
    survivor: {
        male: [
            'abza_npcs:textures/entity/survivor/survivor_1.png',
            'abza_npcs:textures/entity/survivor/survivor_2.png',
            'abza_npcs:textures/entity/survivor/survivor_4.png',
            'abza_npcs:textures/entity/survivor/survivor_5_slim.png'
        ],
        female: [
            'abza_npcs:textures/entity/survivor/survivor_3.png',
            'abza_npcs:textures/entity/survivor/survivor_6.png'
        ]
    },
    // the Free Air Corps' soldiers and pilots
    corps: {
        male: [
            'abza_npcs:textures/entity/corps/corps_1.png',
            'abza_npcs:textures/entity/corps/corps_2.png',
            'abza_npcs:textures/entity/corps/corps_3.png',
            'abza_npcs:textures/entity/corps/corps_4.png'
        ],
        female: []
    },
    // Station Crew on the Moon
    crew: {
        male: [
            'abza_npcs:textures/entity/crew/crew_3.png'
        ],
        female: [
            'abza_npcs:textures/entity/crew/crew_1_slim.png',
            'abza_npcs:textures/entity/crew/crew_2_slim.png',
            'abza_npcs:textures/entity/crew/crew_4_slim.png'
        ]
    },
    // Raiders
    raider: {
        male: [
            'abza_npcs:textures/entity/raider/raider_1.png',
            'abza_npcs:textures/entity/raider/raider_2.png',
            'abza_npcs:textures/entity/raider/raider_3.png',
            'abza_npcs:textures/entity/raider/raider_4_slim.png',
            'abza_npcs:textures/entity/raider/raider_5.png',
            'abza_npcs:textures/entity/raider/raider_6.png',
            'abza_npcs:textures/entity/raider/raider_7.png'
        ],
        female: []
    },
    // the Garrison on Earth
    garrison: {
        male: [
            'abza_npcs:textures/entity/garrison/garrison_1.png',
            'abza_npcs:textures/entity/garrison/garrison_2.png',
            'abza_npcs:textures/entity/garrison/garrison_3_slim.png',
            'abza_npcs:textures/entity/garrison/garrison_4.png',
            'abza_npcs:textures/entity/garrison/garrison_5_slim.png'
        ],
        female: []
    },
    // the Garrison's guards on the Moon
    garrison_space: {
        male: [
            'abza_npcs:textures/entity/garrison_space/garrison_space_1.png',
            'abza_npcs:textures/entity/garrison_space/garrison_space_2.png'
        ],
        female: []
    },
    // researchers at the T2 camp and the planet camps
    scientist: {
        male: [
            'abza_npcs:textures/entity/scientist/scientist_2.png'
        ],
        female: [
            'abza_npcs:textures/entity/scientist/scientist_1_slim.png'
        ]
    }
}

const ABZA_NPC_NAMES = {
    male: [
        'James', 'Thomas', 'Daniel', 'Michael', 'Ryan', 'Owen', 'Mateo', 'Diego', 'Javier', 'Luis', 'Andres',
        'Carlos', 'Joao', 'Pedro', 'Rafael', 'Tiago', 'Bruno', 'Rodrigo', 'Piotr', 'Tomasz', 'Marek', 'Jakub',
        'Pawel', 'Lukasz', 'Lukas', 'Jonas', 'Felix', 'Stefan', 'Niklas', 'Jan', 'Hugo', 'Louis', 'Mathis',
        'Julien', 'Antoine', 'Theo', 'Marco', 'Luca', 'Alessandro', 'Giorgio', 'Davide', 'Paolo', 'Chinedu',
        'Emeka', 'Tunde', 'Femi', 'Ibrahim', 'Obinna', 'Kwame', 'Kofi', 'Yaw', 'Kojo', 'Juma', 'Baraka', 'Arjun',
        'Rohan', 'Vikram', 'Rahul', 'Aditya', 'Karan', 'Haruto', 'Kenji', 'Takeshi', 'Ren', 'Daiki', 'Yuto', 'Wei',
        'Jun', 'Hao', 'Lei', 'Ming', 'Jian', 'Minjun', 'Jihoon', 'Hyun', 'Seojun', 'Donghyun', 'Jaewon', 'Omar',
        'Yusuf', 'Karim', 'Tariq', 'Hassan', 'Samir', 'Andriy', 'Oleksandr', 'Taras', 'Bohdan', 'Mykola', 'Dmytro',
        'Erik', 'Lars', 'Magnus', 'Anders', 'Nils', 'Henrik', 'Jose', 'Mark', 'Miguel', 'Angelo', 'Carlo'
    ],
    female: [
        'Emma', 'Sarah', 'Chloe', 'Hannah', 'Grace', 'Megan', 'Lucia', 'Sofia', 'Valeria', 'Camila', 'Elena',
        'Carmen', 'Beatriz', 'Mariana', 'Juliana', 'Larissa', 'Carolina', 'Ana', 'Agnieszka', 'Katarzyna', 'Zofia',
        'Magda', 'Ewa', 'Natalia', 'Anna', 'Lea', 'Hanna', 'Katrin', 'Johanna', 'Marie', 'Camille', 'Manon',
        'Juliette', 'Margaux', 'Elodie', 'Amelie', 'Giulia', 'Chiara', 'Francesca', 'Sara', 'Alessia', 'Martina',
        'Ngozi', 'Amaka', 'Funmilayo', 'Chioma', 'Aisha', 'Yetunde', 'Ama', 'Akosua', 'Efua', 'Abena', 'Wanjiru',
        'Zawadi', 'Priya', 'Ananya', 'Kavya', 'Neha', 'Meera', 'Divya', 'Yuki', 'Hana', 'Aiko', 'Mei', 'Sakura',
        'Rin', 'Xiu', 'Yan', 'Jing', 'Hui', 'Lan', 'Ying', 'Jiwoo', 'Seoyeon', 'Minji', 'Hayoon', 'Soyeon', 'Yuna',
        'Layla', 'Nour', 'Fatima', 'Yasmin', 'Rania', 'Salma', 'Oksana', 'Olena', 'Iryna', 'Kateryna', 'Daria',
        'Sofiia', 'Ingrid', 'Astrid', 'Freya', 'Sigrid', 'Maja', 'Linnea', 'Maria', 'Andrea', 'Kristine',
        'Angelica', 'Joy', 'Patricia'
    ]
}

// Named characters: name, title, skin, faction, size (5 is a grown adult; above 5.5 it no longer fits a door) and pose
// (a name of ABZA_NPC_POSES); each stands up again 300 seconds after dying
const ABZA_NPC_CAST = {
    ines: { name: 'Ines', title: 'Navigator', skin: 'abza_npcs:textures/entity/named/navigator.png', faction: 0, size: 4.9, respawn: 300 },
    ruth: { name: 'Ruth', title: 'Medic', skin: 'abza_npcs:textures/entity/named/medic_slim.png', faction: 0, size: 4.8, respawn: 300 },
    teddy: { name: 'Teddy', title: 'Trader', skin: 'abza_npcs:textures/entity/named/trader.png', faction: 0, size: 5.2, pose: 'sit', respawn: 300 },
    bram: { name: 'Bram', title: 'Gunsmith', skin: 'abza_npcs:textures/entity/named/gunsmith.png', faction: 0, size: 5.8, respawn: 300 },
    lena: { name: 'Lena', title: 'Scientist', skin: 'abza_npcs:textures/entity/named/scientist_slim.png', faction: 1, size: 4.85, pose: 'crouch', respawn: 300 },
    bello: { name: 'Bello', title: 'Major', skin: 'abza_npcs:textures/entity/named/officer.png', faction: 2, size: 5.4, respawn: 300 },
    paz: { name: 'Paz', title: 'Station Crew', skin: 'abza_npcs:textures/entity/named/worker.png', faction: 3, size: 4.9, respawn: 300 },
    julian: { name: 'Julian', title: 'Everwell', skin: 'abza_npcs:textures/entity/named/owner.png', faction: 6, size: 5.1, pose: 'sit' }
}

// Poses an NPC holds while it stands (CustomNPCs' animations)
const ABZA_NPC_POSES = { sit: 1, lie: 2, crouch: 4, dance: 5, point: 8, cry: 9, wave: 10 }
