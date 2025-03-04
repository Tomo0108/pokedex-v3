// PokeAPIからデータを取得してJSONファイルとして保存するスクリプト
const fs = require('fs');
const path = require('path');
const https = require('https');

const POKEAPI_URL = 'https://pokeapi.co/api/v2';
const DATA_DIR = path.join(__dirname, '../public/data');

// 世代ごとのポケモンIDの範囲
const GENERATION_RANGES = {
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025],
};

// HTTPSリクエストを行う関数
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 最新の説明文を取得する関数
function getLatestDescription(flavorTextEntries, language, generation) {
  const validEntries = flavorTextEntries
    .filter(entry => entry.language.name === language)
    .filter(entry => {
      const version = entry.version.name;
      // 世代に応じたバージョンのみをフィルタリング
      switch (generation) {
        case 1: return ['red', 'blue', 'yellow'].includes(version);
        case 2: return ['gold', 'silver', 'crystal'].includes(version);
        case 3: return ['ruby', 'sapphire', 'emerald', 'firered', 'leafgreen'].includes(version);
        case 4: return ['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver'].includes(version);
        case 5: return ['black', 'white', 'black-2', 'white-2'].includes(version);
        case 6: return ['x', 'y', 'omega-ruby', 'alpha-sapphire'].includes(version);
        case 7: return ['sun', 'moon', 'ultra-sun', 'ultra-moon', 'lets-go-pikachu', 'lets-go-eevee'].includes(version);
        case 8: return ['sword', 'shield', 'legends-arceus', 'brilliant-diamond', 'shining-pearl'].includes(version);
        case 9: return ['scarlet', 'violet'].includes(version);
        default: return true;
      }
    });

  return validEntries.length > 0 
    ? validEntries[0].flavor_text.replace(/[\n\f]/g, ' ') 
    : '';
}

// ポケモンデータを取得する関数
async function fetchPokemonData(id) {
  try {
    console.log(`Fetching data for Pokemon #${id}...`);
    
    const [pokemon, species] = await Promise.all([
      fetchData(`${POKEAPI_URL}/pokemon/${id}`),
      fetchData(`${POKEAPI_URL}/pokemon-species/${id}`)
    ]);

    // 世代ごとの説明文を取得
    const descriptions = {};
    for (let gen = 1; gen <= 9; gen++) {
      descriptions[gen] = {
        en: getLatestDescription(species.flavor_text_entries, 'en', gen),
        ja: getLatestDescription(species.flavor_text_entries, 'ja', gen)
      };
    }

    // 日本語名を取得
    const jaName = species.names.find(name => name.language.name === 'ja')?.name || pokemon.name;

    return {
      id: pokemon.id,
      name: pokemon.name,
      japaneseName: jaName,
      types: pokemon.types.map(t => t.type.name),
      descriptions: descriptions
    };
  } catch (error) {
    console.error(`Error fetching Pokemon #${id}:`, error);
    return null;
  }
}

// 世代ごとにポケモンデータを取得して保存する関数
async function fetchGenerationData(generation) {
  const [start, end] = GENERATION_RANGES[generation];
  const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  
  console.log(`Fetching data for Generation ${generation} (Pokemon #${start}-${end})...`);
  
  const pokemonData = [];
  for (const id of ids) {
    const data = await fetchPokemonData(id);
    if (data) {
      pokemonData.push(data);
    }
    // APIレート制限を避けるために少し待機
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // データをJSONファイルとして保存
  const outputPath = path.join(DATA_DIR, `generation-${generation}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(pokemonData, null, 2));
  
  console.log(`Generation ${generation} data saved to ${outputPath}`);
}

// メイン関数
async function main() {
  // データディレクトリが存在しない場合は作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // 全世代のデータを取得
  for (const generation of Object.keys(GENERATION_RANGES)) {
    await fetchGenerationData(Number(generation));
  }
  
  console.log('All Pokemon data has been fetched and saved!');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 