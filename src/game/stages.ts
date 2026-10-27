import { StageConfig, EnemyType, TileType } from '../types/game';
import { STAGE_COLS, GRID_COLS, GRID_ROWS, BASE_COORD } from './constants';

// Helper to create an empty 26x26 core stage blueprint grid
function createEmptyGrid(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    grid[r] = new Array(STAGE_COLS).fill(TileType.EMPTY);
  }
  return grid;
}

// Add base and progressively tougher protective walls based on stage number
function addBaseAndFortress(grid: number[][], stageNum: number = 1) {
  // Base at cols 12,13 and rows 24,25
  grid[24][12] = TileType.BASE;
  grid[24][13] = TileType.BASE;
  grid[25][12] = TileType.BASE;
  grid[25][13] = TileType.BASE;

  // Progressive base perimeter hardening
  let wallType = TileType.BRICK;
  if (stageNum >= 3 && stageNum <= 4) {
    wallType = TileType.REINFORCED_WALL; // Concrete Reinforced 2-HP walls
  } else if (stageNum >= 5 && stageNum <= 8) {
    wallType = TileType.STEEL; // Hardened Steel armor
  } else if (stageNum >= 9) {
    wallType = TileType.ENERGY_BARRIER; // Quantum Energy Barrier
  }

  // Wall surround
  for (let c = 11; c <= 14; c++) {
    grid[23][c] = wallType;
  }
  grid[24][11] = wallType;
  grid[25][11] = wallType;
  grid[24][14] = wallType;
  grid[25][14] = wallType;
}

// Stage 1: Classic Suburban Defense
function makeStage1(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 1);

  // Vertical brick columns
  const cols = [3, 4, 7, 8, 11, 12, 13, 14, 17, 18, 21, 22];
  for (const c of cols) {
    if (c === 12 || c === 13) continue; // Don't block middle top
    for (let r = 3; r <= 8; r++) grid[r][c] = TileType.BRICK;
    for (let r = 12; r <= 18; r++) grid[r][c] = TileType.BRICK;
  }

  // Steel blockers
  for (let r = 10; r <= 11; r++) {
    grid[r][1] = TileType.STEEL;
    grid[r][2] = TileType.STEEL;
    grid[r][23] = TileType.STEEL;
    grid[r][24] = TileType.STEEL;
    grid[r][12] = TileType.STEEL;
    grid[r][13] = TileType.STEEL;
  }

  const enemies: EnemyType[] = [
    'SCOUT', 'SCOUT', 'ASSAULT', 'SCOUT',
    'ASSAULT', 'SCOUT', 'HEAVY', 'ASSAULT',
    'SCOUT', 'HEAVY', 'ASSAULT', 'HEAVY'
  ];

  return {
    id: 1,
    name: 'Màn 1: Căn Cứ Ngoại Ô',
    description: 'Bảo vệ sở chỉ huy trước đợt tấn công mở đầu của lính trinh sát và thiết giáp địch.',
    grid,
    enemies,
    maxActiveEnemies: 4,
  };
}

// Stage 2: Kho Quân Nhu Tiền Tiêu (Đã xóa bớt cây rậm rạp cho quang đãng, dễ quan sát)
function makeStage2(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 2);

  // Chỉ giữ lại một vài khóm cây nhỏ xíu làm cảnh (8 ô thay vì 150 ô trước đây)
  grid[5][8] = TileType.BUSH;
  grid[5][9] = TileType.BUSH;
  grid[6][8] = TileType.BUSH;
  grid[6][9] = TileType.BUSH;

  grid[15][16] = TileType.BUSH;
  grid[15][17] = TileType.BUSH;
  grid[16][16] = TileType.BUSH;
  grid[16][17] = TileType.BUSH;

  // Dãy thùng gỗ quân sự tiếp tế hai bên cánh (quang đãng, dễ bắn phá mở đường)
  for (let r = 4; r <= 8; r++) {
    grid[r][5] = TileType.BRICK;
    grid[r][20] = TileType.BRICK;
  }
  for (let r = 13; r <= 17; r++) {
    grid[r][5] = TileType.BRICK;
    grid[r][20] = TileType.BRICK;
  }

  // Thùng gỗ yểm trợ dọc hai rìa ngoài
  for (let r = 6; r <= 15; r += 3) {
    grid[r][2] = TileType.BRICK;
    grid[r][3] = TileType.BRICK;
    grid[r][22] = TileType.BRICK;
    grid[r][23] = TileType.BRICK;
  }

  // Center water pond
  for (let r = 9; r <= 12; r++) {
    for (let c = 11; c <= 14; c++) {
      grid[r][c] = TileType.WATER;
    }
  }

  const enemies: EnemyType[] = [
    'SCOUT', 'SCOUT', 'SCOUT', 'ASSAULT',
    'ASSAULT', 'SCOUT', 'HEAVY', 'ARTILLERY',
    'ASSAULT', 'HEAVY', 'SCOUT', 'HEAVY', 'ARTILLERY'
  ];

  return {
    id: 2,
    name: 'Màn 2: Kho Quân Nhu Tiền Tiêu',
    description: 'Bản đồ thoáng đãng, đã dọn bớt cây rậm rạp. Bắn phá các thùng gỗ tiếp tế để mở đường tiêu diệt địch!',
    grid,
    enemies,
    maxActiveEnemies: 4,
  };
}

// Stage 3: Steel Refinery
function makeStage3(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 3);

  // Steel corridors
  for (let r = 3; r <= 7; r++) {
    grid[r][6] = TileType.STEEL;
    grid[r][19] = TileType.STEEL;
  }
  for (let r = 13; r <= 17; r++) {
    grid[r][6] = TileType.STEEL;
    grid[r][19] = TileType.STEEL;
  }

  // Brick maze
  for (let r = 5; r <= 19; r += 2) {
    for (let c = 9; c <= 16; c++) {
      if (c === 12 || c === 13) continue;
      grid[r][c] = TileType.BRICK;
    }
  }

  const enemies: EnemyType[] = [
    'ASSAULT', 'ASSAULT', 'HEAVY', 'SCOUT',
    'HEAVY', 'HEAVY', 'ARTILLERY', 'ASSAULT',
    'HEAVY', 'ARTILLERY', 'HEAVY', 'HEAVY', 'HEAVY'
  ];

  return {
    id: 3,
    name: 'Màn 3: Nhà Máy Luyện Thép',
    description: 'Hàng rào thép kiên cố tạo nên các hành lang hẹp. Căn cứ được bọc bê tông cường lực!',
    grid,
    enemies,
    maxActiveEnemies: 5,
  };
}

// Stage 4: Canal Crossing
function makeStage4(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 4);

  // Water river cutting horizontally with 2 bridges
  for (let c = 0; c < STAGE_COLS; c++) {
    if ((c >= 5 && c <= 7) || (c >= 18 && c <= 20)) {
      grid[11][c] = TileType.ICE;
      grid[12][c] = TileType.ICE;
    } else {
      grid[11][c] = TileType.WATER;
      grid[12][c] = TileType.WATER;
    }
  }

  // Brick bunkers
  for (let r = 3; r <= 8; r++) {
    grid[r][3] = TileType.BRICK;
    grid[r][22] = TileType.BRICK;
    grid[r][12] = TileType.BRICK;
    grid[r][13] = TileType.BRICK;
  }
  for (let r = 15; r <= 20; r++) {
    grid[r][3] = TileType.BRICK;
    grid[r][22] = TileType.BRICK;
    grid[r][8] = TileType.BRICK;
    grid[r][17] = TileType.BRICK;
  }

  const enemies: EnemyType[] = [
    'SCOUT', 'ARTILLERY', 'ASSAULT', 'ARTILLERY',
    'HEAVY', 'SCOUT', 'ARTILLERY', 'HEAVY',
    'ASSAULT', 'HEAVY', 'ARTILLERY', 'ARTILLERY', 'HEAVY', 'HEAVY'
  ];

  return {
    id: 4,
    name: 'Màn 4: Kênh Đào Huyết Mạch',
    description: 'Dòng sông ngăn cách chiến trường. Pháo binh địch có thể bắn tỉa xuyên qua làn nước!',
    grid,
    enemies,
    maxActiveEnemies: 5,
  };
}

// Stage 5: Central Fortress
function makeStage5(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 5);

  // Center Fortress
  for (let r = 7; r <= 15; r++) {
    for (let c = 8; c <= 17; c++) {
      if (r === 7 || r === 15 || c === 8 || c === 17) {
        grid[r][c] = (r === 7 && (c === 12 || c === 13)) ? TileType.EMPTY : TileType.BRICK;
      }
      if (r === 11 && c >= 10 && c <= 15) {
        grid[r][c] = TileType.STEEL;
      }
    }
  }

  // Ice paths around flanks
  for (let r = 4; r <= 20; r++) {
    grid[r][2] = TileType.ICE;
    grid[r][23] = TileType.ICE;
  }

  const enemies: EnemyType[] = [
    'SCOUT', 'ASSAULT', 'HEAVY', 'ARTILLERY',
    'ASSAULT', 'HEAVY', 'HEAVY', 'ARTILLERY',
    'HEAVY', 'HEAVY', 'ASSAULT', 'HEAVY', 'HEAVY', 'HEAVY'
  ];

  return {
    id: 5,
    name: 'Màn 5: Pháo Đài Trung Tâm',
    description: 'Địch phòng thủ trong pháo đài trung tâm. Căn cứ được nâng cấp tường thép hợp kim chống pháo!',
    grid,
    enemies,
    maxActiveEnemies: 5,
  };
}

// Stage 6: Arctic Outpost (Tiền Đồn Bắc Cực - Mặt băng đã xóa)
function makeStage6(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 6);

  // Brick tactical maze in center
  for (let r = 4; r <= 16; r += 2) {
    for (let c = 10; c <= 15; c++) {
      grid[r][c] = TileType.BRICK;
    }
  }

  // Flank defensive pillboxes
  grid[8][4] = TileType.STEEL;
  grid[8][5] = TileType.STEEL;
  grid[15][4] = TileType.STEEL;
  grid[15][5] = TileType.STEEL;

  grid[8][20] = TileType.STEEL;
  grid[8][21] = TileType.STEEL;
  grid[15][20] = TileType.STEEL;
  grid[15][21] = TileType.STEEL;

  const enemies: EnemyType[] = [
    'SCOUT', 'SCOUT', 'SCOUT', 'SCOUT',
    'ASSAULT', 'ASSAULT', 'HEAVY', 'ARTILLERY',
    'SCOUT', 'HEAVY', 'HEAVY', 'ARTILLERY', 'HEAVY', 'HEAVY', 'HEAVY'
  ];

  return {
    id: 6,
    name: 'Màn 6: Tiền Đồn Bắc Cực',
    description: 'Đột kích tiền đồn Bắc Cực quang đãng. Địch bố trí đội hình trinh sát và thiết giáp phối hợp hỏa lực dày đặc!',
    grid,
    enemies,
    maxActiveEnemies: 6,
  };
}

// Stage 7: Artillery Gauntlet (Trận Địa Pháo Kích & Thùng Nổ Chiến Thuật)
function makeStage7(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 7);

  // Steel defensive trenches
  for (let c = 2; c <= 23; c += 4) {
    grid[5][c] = TileType.STEEL;
    grid[5][c + 1] = TileType.STEEL;
    grid[13][c] = TileType.STEEL;
    grid[13][c + 1] = TileType.STEEL;
  }

  // Bushes & bricks
  for (let r = 8; r <= 10; r++) {
    for (let c = 4; c <= 21; c++) {
      grid[r][c] = (c % 2 === 0) ? TileType.BUSH : TileType.BRICK;
    }
  }

  // Tactical Explosive Fuel Barrels (Thùng nhiên liệu nổ)
  grid[7][6] = TileType.EXPLOSIVE_BARREL;
  grid[7][7] = TileType.EXPLOSIVE_BARREL;
  grid[7][18] = TileType.EXPLOSIVE_BARREL;
  grid[7][19] = TileType.EXPLOSIVE_BARREL;
  grid[15][4] = TileType.EXPLOSIVE_BARREL;
  grid[15][5] = TileType.EXPLOSIVE_BARREL;
  grid[15][20] = TileType.EXPLOSIVE_BARREL;
  grid[15][21] = TileType.EXPLOSIVE_BARREL;
  grid[11][12] = TileType.EXPLOSIVE_BARREL;
  grid[11][13] = TileType.EXPLOSIVE_BARREL;

  const enemies: EnemyType[] = [
    'ARTILLERY', 'ARTILLERY', 'ASSAULT', 'HEAVY',
    'ARTILLERY', 'ARTILLERY', 'HEAVY', 'HEAVY',
    'ASSAULT', 'ARTILLERY', 'ARTILLERY', 'HEAVY', 'HEAVY', 'HEAVY', 'HEAVY'
  ];

  return {
    id: 7,
    name: 'Màn 7: Hỏa Lực Pháo Binh',
    description: 'Trận địa pháo kích tầm xa kết hợp các thùng nhiên liệu nổ chiến thuật. Bắn trúng thùng nổ để hủy diệt xe pháo địch xung quanh!',
    grid,
    enemies,
    maxActiveEnemies: 6,
  };
}

// Stage 8: Valley of Ambush
function makeStage8(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 8);

  // Twin water channels
  for (let r = 3; r <= 19; r++) {
    grid[r][5] = TileType.WATER;
    grid[r][20] = TileType.WATER;
  }

  // Brick fortresses
  for (let r = 4; r <= 17; r += 3) {
    for (let c = 8; c <= 17; c++) {
      if (c === 12 || c === 13) continue;
      grid[r][c] = TileType.BRICK;
    }
  }

  // Tactical Explosive Fuel Barrels
  grid[6][4] = TileType.EXPLOSIVE_BARREL;
  grid[7][4] = TileType.EXPLOSIVE_BARREL;
  grid[6][21] = TileType.EXPLOSIVE_BARREL;
  grid[7][21] = TileType.EXPLOSIVE_BARREL;
  grid[14][10] = TileType.EXPLOSIVE_BARREL;
  grid[14][11] = TileType.EXPLOSIVE_BARREL;
  grid[14][14] = TileType.EXPLOSIVE_BARREL;
  grid[14][15] = TileType.EXPLOSIVE_BARREL;
  grid[10][1] = TileType.EXPLOSIVE_BARREL;
  grid[10][2] = TileType.EXPLOSIVE_BARREL;
  grid[10][23] = TileType.EXPLOSIVE_BARREL;
  grid[10][24] = TileType.EXPLOSIVE_BARREL;

  const enemies: EnemyType[] = [
    'SCOUT', 'ASSAULT', 'HEAVY', 'ARTILLERY',
    'HEAVY', 'HEAVY', 'ARTILLERY', 'HEAVY',
    'ASSAULT', 'HEAVY', 'HEAVY', 'ARTILLERY', 'HEAVY', 'HEAVY', 'HEAVY', 'HEAVY'
  ];

  return {
    id: 8,
    name: 'Màn 8: Thung Lũng Phục Kích',
    description: 'Các kênh nước chia cắt quân đoàn, bố trí các thùng nổ chiến lược tại cửa ngõ tiến công của địch!',
    grid,
    enemies,
    maxActiveEnemies: 6,
  };
}

// Stage 9: Last Iron Curtain
function makeStage9(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 9);

  // Checkerboard brick and steel
  for (let r = 3; r <= 18; r += 3) {
    for (let c = 2; c <= 23; c += 3) {
      grid[r][c] = (r + c) % 2 === 0 ? TileType.STEEL : TileType.BRICK;
      grid[r][c + 1] = TileType.BRICK;
    }
  }

  // Tactical Explosive Fuel Barrels
  grid[5][5] = TileType.EXPLOSIVE_BARREL;
  grid[5][6] = TileType.EXPLOSIVE_BARREL;
  grid[5][19] = TileType.EXPLOSIVE_BARREL;
  grid[5][20] = TileType.EXPLOSIVE_BARREL;
  grid[11][8] = TileType.EXPLOSIVE_BARREL;
  grid[11][9] = TileType.EXPLOSIVE_BARREL;
  grid[11][16] = TileType.EXPLOSIVE_BARREL;
  grid[11][17] = TileType.EXPLOSIVE_BARREL;
  grid[14][12] = TileType.EXPLOSIVE_BARREL;
  grid[14][13] = TileType.EXPLOSIVE_BARREL;

  const enemies: EnemyType[] = [
    'HEAVY', 'HEAVY', 'ARTILLERY', 'ASSAULT',
    'HEAVY', 'HEAVY', 'ARTILLERY', 'HEAVY',
    'HEAVY', 'HEAVY', 'ARTILLERY', 'HEAVY',
    'HEAVY', 'HEAVY', 'HEAVY', 'HEAVY', 'HEAVY', 'HEAVY'
  ];

  return {
    id: 9,
    name: 'Màn 9: Bức Tường Thép',
    description: 'Hàng rào thép kiên cố đan xen các thùng nổ nhiên liệu cao áp. Kích nổ thùng để phá hủy hàng ngũ thiết giáp địch!',
    grid,
    enemies,
    maxActiveEnemies: 6,
  };
}

// Stage 10: Titan Boss Battle
function makeStage10(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 10);

  // Grand arena pillars
  const pillars = [
    [5, 5], [5, 20], [15, 5], [15, 20],
    [9, 10], [9, 15]
  ];
  for (const [r, c] of pillars) {
    grid[r][c] = TileType.STEEL;
    grid[r + 1][c] = TileType.STEEL;
    grid[r][c + 1] = TileType.STEEL;
    grid[r + 1][c + 1] = TileType.STEEL;
  }

  // Scattered brick covers
  for (let r = 3; r <= 18; r += 5) {
    for (let c = 8; c <= 17; c++) {
      if (c !== 12 && c !== 13) {
        grid[r][c] = TileType.BRICK;
      }
    }
  }

  // Tactical Explosive Fuel Barrels around Arena
  grid[7][7] = TileType.EXPLOSIVE_BARREL;
  grid[7][8] = TileType.EXPLOSIVE_BARREL;
  grid[7][17] = TileType.EXPLOSIVE_BARREL;
  grid[7][18] = TileType.EXPLOSIVE_BARREL;
  grid[13][7] = TileType.EXPLOSIVE_BARREL;
  grid[13][8] = TileType.EXPLOSIVE_BARREL;
  grid[13][17] = TileType.EXPLOSIVE_BARREL;
  grid[13][18] = TileType.EXPLOSIVE_BARREL;
  grid[11][3] = TileType.EXPLOSIVE_BARREL;
  grid[11][4] = TileType.EXPLOSIVE_BARREL;
  grid[11][21] = TileType.EXPLOSIVE_BARREL;
  grid[11][22] = TileType.EXPLOSIVE_BARREL;

  const enemies: EnemyType[] = [
    'HEAVY', 'ARTILLERY', 'BOSS', 'HEAVY', 'ARTILLERY', 'HEAVY', 'HEAVY'
  ];

  return {
    id: 10,
    name: 'Màn 10: Trận Chiến Titan Tối Thượng',
    description: 'Trùm Chiến Hạm Titan xuất hiện. Tận dụng các thùng nổ rải rác trong đấu trường để gây sát thương diện rộng lên Trùm và tùy tùng!',
    grid,
    enemies,
    maxActiveEnemies: 4,
  };
}

export const CAMPAIGN_STAGES: StageConfig[] = [
  makeStage1(),
  makeStage2(),
  makeStage3(),
  makeStage4(),
  makeStage5(),
  makeStage6(),
  makeStage7(),
  makeStage8(),
  makeStage9(),
  makeStage10(),
];

// Generate Massive Strategic Warzone for Survival Mode (56 cols x 40 rows, expandable, NO BASE)
export function generateSurvivalStage(wave: number, stageId: number = wave): StageConfig {
  const rows = 40; // Massive expanded height
  const cols = 56; // Massive expanded width
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = new Array(cols).fill(TileType.EMPTY);
  }

  // NOTE: IN SURVIVAL MODE, THERE IS NO HOME BASE!
  // The player operates independently across the vast warzone and wins by destroying all enemy tanks!

  // 1. Water Ponds with Wide Bridges (open navigation - tanks will never get trapped)
  // Northwest Pond
  for (let r = 8; r <= 12; r++) {
    for (let c = 12; c <= 16; c++) {
      grid[r][c] = TileType.WATER;
    }
  }
  // Northeast Pond
  for (let r = 8; r <= 12; r++) {
    for (let c = 39; c <= 43; c++) {
      grid[r][c] = TileType.WATER;
    }
  }
  // Southwest Pond
  for (let r = 27; r <= 31; r++) {
    for (let c = 12; c <= 16; c++) {
      grid[r][c] = TileType.WATER;
    }
  }
  // Southeast Pond
  for (let r = 27; r <= 31; r++) {
    for (let c = 39; c <= 43; c++) {
      grid[r][c] = TileType.WATER;
    }
  }

  // Tactical Explosive Fuel Barrels (Thùng nhiên liệu nổ)
  // Replaces the old ice surfaces with high-impact strategic explosive barrel caches
  const barrelCaches = [
    // West tactical depot cache
    [19, 9], [19, 10], [20, 9], [20, 10],
    // East tactical depot cache
    [19, 45], [19, 46], [20, 45], [20, 46],
    // Northwest chokepoint cache
    [10, 18], [11, 18],
    // Northeast chokepoint cache
    [10, 37], [11, 37],
    // Southwest ambush cache
    [29, 18], [30, 18],
    // Southeast ambush cache
    [29, 37], [30, 37],
    // North center crossroads cache
    [10, 27], [10, 28],
    // South center crossroads cache
    [29, 27], [29, 28],
  ];

  for (const [br, bc] of barrelCaches) {
    grid[br][bc] = TileType.EXPLOSIVE_BARREL;
  }

  // 2. Tactical Fortified Bunkers (isolated 2x2 pillboxes with wide clearance around them)
  const pillboxes = [
    [6, 6], [6, 48], [32, 6], [32, 48],
    [18, 16], [18, 38], [8, 27], [30, 27],
  ];
  for (const [br, bc] of pillboxes) {
    grid[br][bc] = TileType.STEEL;
    grid[br][bc + 1] = TileType.STEEL;
    grid[br + 1][bc] = TileType.STEEL;
    grid[br + 1][bc + 1] = TileType.STEEL;
  }

  // 3. Destructible Wooden Supply Crate Clusters & Brick Walls (can be blasted through by both player and AI tanks)
  const seed = wave * 3041 + 137;
  for (let r = 4; r < rows - 4; r += 2) {
    for (let c = 4; c < cols - 4; c += 2) {
      // Keep central staging area (cols 22..33, rows 16..24) completely clear
      if (c >= 22 && c <= 33 && r >= 16 && r <= 24) continue;
      // Do not overwrite water or steel
      if (grid[r][c] !== TileType.EMPTY) continue;

      const val = Math.sin(seed + r * 17 + c * 23);
      if (val > 0.42) {
        grid[r][c] = TileType.BRICK;
        if (c + 1 < cols - 4 && grid[r][c + 1] === TileType.EMPTY) {
          grid[r][c + 1] = TileType.BRICK;
        }
      } else if (val < -0.82) {
        grid[r][c] = TileType.STEEL;
      }
    }
  }

  // 4. Strategic Foliage / Bushes for tactical ambush
  const bushSectors = [
    { r1: 5, r2: 8, c1: 20, c2: 24 },
    { r1: 5, r2: 8, c1: 31, c2: 35 },
    { r1: 31, r2: 34, c1: 20, c2: 24 },
    { r1: 31, r2: 34, c1: 31, c2: 35 },
  ];
  for (const b of bushSectors) {
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        if (grid[r][c] === TileType.EMPTY) {
          grid[r][c] = TileType.BUSH;
        }
      }
    }
  }

  // 5. GUARANTEE ALL ENEMY SPAWN ZONES ARE 100% EMPTY (Zero stuck tanks!)
  const spawnCoordinates = [
    { r: 3, c: 6 },
    { r: 3, c: 18 },
    { r: 3, c: 28 },
    { r: 3, c: 38 },
    { r: 3, c: 49 },
    { r: rows - 4, c: 6 },
    { r: rows - 4, c: 18 },
    { r: rows - 4, c: 28 },
    { r: rows - 4, c: 38 },
    { r: rows - 4, c: 49 },
    { r: 14, c: 3 },
    { r: 25, c: 3 },
    { r: 14, c: cols - 4 },
    { r: 25, c: cols - 4 },
  ];

  for (const sp of spawnCoordinates) {
    for (let dr = -1; dr <= 2; dr++) {
      for (let dc = -1; dc <= 2; dc++) {
        const tr = sp.r + dr;
        const tc = sp.c + dc;
        if (tr >= 0 && tr < rows && tc >= 0 && tc < cols) {
          grid[tr][tc] = TileType.EMPTY;
        }
      }
    }
  }

  // Also guarantee player staging ground (cols 24..31, rows 17..22) is completely empty
  for (let r = 16; r <= 23; r++) {
    for (let c = 23; c <= 32; c++) {
      grid[r][c] = TileType.EMPTY;
    }
  }

  // 6. Enemy Roster: Scaled, intense and conquerable
  // Wave 1: 18 tanks (exciting pace, victory within reach)
  // Wave 2: 24 tanks
  // Wave 3+: +6 per wave up to 42
  const count = Math.min(42, 18 + (wave - 1) * 6);
  const enemies: EnemyType[] = [];

  for (let i = 0; i < count; i++) {
    // Titan boss each wave (middle and final enemy)
    if (i === count - 1 || (wave >= 2 && i === Math.floor(count / 2))) {
      enemies.push('BOSS');
    } else {
      const weight = Math.random();
      if (weight < 0.35) enemies.push('SCOUT');
      else if (weight < 0.65) enemies.push('ASSAULT');
      else if (weight < 0.88) enemies.push('HEAVY');
      else enemies.push('ARTILLERY');
    }
  }

  return {
    id: stageId,
    name: `Sinh Tồn Mở Rộng - Đợt ${wave}`,
    description: `Chiến trường siêu rộng không có căn cứ chủ! Di chuyển đến gần viền để mở rộng map, tiêu diệt toàn bộ ${count} xe tăng địch để chiến thắng!`,
    grid,
    enemies,
    maxActiveEnemies: Math.min(8, 6 + Math.floor(wave / 2)),
  };
}

// Boss Rush Stage
export function generateBossRushStage(): StageConfig {
  const grid = createEmptyGrid();
  addBaseAndFortress(grid, 10);

  // Open arena with strategic steel barriers
  for (let r = 6; r <= 16; r += 5) {
    grid[r][6] = TileType.STEEL;
    grid[r][7] = TileType.STEEL;
    grid[r][18] = TileType.STEEL;
    grid[r][19] = TileType.STEEL;
  }

  const enemies: EnemyType[] = [
    'HEAVY', 'BOSS', 'ARTILLERY', 'BOSS', 'HEAVY', 'BOSS'
  ];

  return {
    id: 99,
    name: 'Đấu Trường Trùm Chiến Hạm',
    description: 'Thách thức tối thượng: Tiêu diệt liên tiếp 3 Trùm Titan cùng toán quân hộ tống!',
    grid,
    enemies,
    maxActiveEnemies: 4,
  };
}
