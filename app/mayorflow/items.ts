import type {
  Category,
  CategoryId,
  Ingredient,
  ItemId,
  ProductionItem,
} from "./types";

export const categories: Category[] = [
  { id: "factory", name: "工厂原料", shortName: "原料", color: "#5b8c00" },
  {
    id: "building-supplies",
    name: "建材店",
    shortName: "建材",
    color: "#d46b08",
  },
  { id: "hardware", name: "五金店", shortName: "五金", color: "#1677ff" },
  {
    id: "farmers-market",
    name: "农贸市场",
    shortName: "农贸",
    color: "#389e0d",
  },
  { id: "furniture", name: "家具店", shortName: "家具", color: "#722ed1" },
  {
    id: "gardening",
    name: "园艺用品店",
    shortName: "园艺",
    color: "#08979c",
  },
  {
    id: "donut-shop",
    name: "甜甜圈店",
    shortName: "甜品",
    color: "#c41d7f",
  },
  { id: "fashion", name: "时装店", shortName: "时装", color: "#531dab" },
  {
    id: "fast-food",
    name: "快餐店",
    shortName: "快餐",
    color: "#cf1322",
  },
  {
    id: "home-appliances",
    name: "家电店",
    shortName: "家电",
    color: "#096dd9",
  },
];

const ingredients = (values: Array<[ItemId, number]>): Ingredient[] =>
  values.map(([itemId, quantity]) => ({ itemId, quantity }));

const defineItem = (
  id: ItemId,
  name: string,
  englishName: string,
  category: CategoryId,
  level: number,
  productionMinutes: number,
  recipe: Array<[ItemId, number]> = [],
): ProductionItem => ({
  id,
  name,
  englishName,
  category,
  level,
  productionMinutes,
  ingredients: ingredients(recipe),
  image: `/items/${id}.png`,
  isFactoryMaterial: category === "factory",
});

export const items: ProductionItem[] = [
  defineItem("metal", "金属", "Metal", "factory", 1, 1),
  defineItem("wood", "木材", "Wood", "factory", 2, 3),
  defineItem("plastic", "塑料", "Plastic", "factory", 5, 9),
  defineItem("seeds", "种子", "Seeds", "factory", 7, 20),
  defineItem("minerals", "矿物", "Minerals", "factory", 11, 30),
  defineItem("chemicals", "化学品", "Chemicals", "factory", 13, 120),
  defineItem("textiles", "纺织品", "Textiles", "factory", 15, 180),
  defineItem(
    "sugarspices",
    "糖和香料",
    "Sugar and Spices",
    "factory",
    17,
    240,
  ),
  defineItem("glass", "玻璃", "Glass", "factory", 19, 300),
  defineItem("animalfeed", "动物饲料", "Animal Feed", "factory", 23, 360),
  defineItem(
    "electricalcomponents",
    "电子元件",
    "Electrical Components",
    "factory",
    29,
    420,
  ),

  defineItem("nails", "钉子", "Nails", "building-supplies", 1, 5, [
    ["metal", 2],
  ]),
  defineItem("planks", "木板", "Planks", "building-supplies", 3, 30, [
    ["wood", 2],
  ]),
  defineItem("bricks", "砖块", "Bricks", "building-supplies", 13, 20, [
    ["minerals", 2],
  ]),
  defineItem("cement", "水泥", "Cement", "building-supplies", 14, 50, [
    ["minerals", 2],
    ["chemicals", 1],
  ]),
  defineItem("glue", "胶水", "Glue", "building-supplies", 15, 60, [
    ["plastic", 1],
    ["chemicals", 2],
  ]),
  defineItem("paintbucket", "油漆", "Paint", "building-supplies", 16, 60, [
    ["metal", 2],
    ["minerals", 1],
    ["chemicals", 2],
  ]),

  defineItem("hammer", "锤子", "Hammer", "hardware", 4, 14, [
    ["metal", 1],
    ["wood", 1],
  ]),
  defineItem("measuringtape", "卷尺", "Measuring Tape", "hardware", 6, 20, [
    ["metal", 1],
    ["plastic", 1],
  ]),
  defineItem("shovel", "铲子", "Shovel", "hardware", 9, 30, [
    ["metal", 1],
    ["wood", 1],
    ["plastic", 1],
  ]),
  defineItem(
    "cookingutensils",
    "厨具",
    "Cooking Utensils",
    "hardware",
    17,
    45,
    [
      ["metal", 2],
      ["wood", 2],
      ["plastic", 2],
    ],
  ),
  defineItem("ladder", "梯子", "Ladder", "hardware", 20, 60, [
    ["metal", 2],
    ["planks", 2],
  ]),
  defineItem("drill", "电钻", "Drill", "hardware", 30, 120, [
    ["metal", 2],
    ["plastic", 2],
    ["electricalcomponents", 1],
  ]),

  defineItem("vegetables", "蔬菜", "Vegetables", "farmers-market", 8, 20, [
    ["seeds", 2],
  ]),
  defineItem("flourbags", "面粉袋", "Flour Bag", "farmers-market", 17, 30, [
    ["seeds", 2],
    ["textiles", 2],
  ]),
  defineItem(
    "fruitberries",
    "水果和浆果",
    "Fruit and Berries",
    "farmers-market",
    18,
    90,
    [
      ["seeds", 2],
      ["treesaplings", 1],
    ],
  ),
  defineItem("cream", "奶油", "Cream", "farmers-market", 23, 75, [
    ["animalfeed", 1],
  ]),
  defineItem("corn", "玉米", "Corn", "farmers-market", 24, 60, [
    ["minerals", 1],
    ["seeds", 4],
  ]),
  defineItem("cheese", "奶酪", "Cheese", "farmers-market", 26, 105, [
    ["animalfeed", 2],
  ]),
  defineItem("beef", "牛肉", "Beef", "farmers-market", 27, 150, [
    ["animalfeed", 3],
  ]),

  defineItem("chairs", "椅子", "Chairs", "furniture", 10, 20, [
    ["wood", 2],
    ["nails", 1],
    ["hammer", 1],
  ]),
  defineItem("tables", "桌子", "Tables", "furniture", 16, 30, [
    ["planks", 1],
    ["nails", 2],
    ["hammer", 1],
  ]),
  defineItem(
    "hometextiles",
    "家居纺织品",
    "Home Textiles",
    "furniture",
    25,
    75,
    [
      ["textiles", 2],
      ["measuringtape", 1],
    ],
  ),
  defineItem("cupboard", "橱柜", "Cupboard", "furniture", 26, 45, [
    ["planks", 2],
    ["glass", 2],
    ["paintbucket", 1],
  ]),
  defineItem("couch", "沙发", "Couch", "furniture", 33, 150, [
    ["textiles", 3],
    ["drill", 1],
    ["glue", 1],
  ]),

  defineItem("grass", "草坪", "Grass", "gardening", 14, 30, [
    ["seeds", 1],
    ["shovel", 1],
  ]),
  defineItem("treesaplings", "树苗", "Tree Saplings", "gardening", 16, 90, [
    ["seeds", 2],
    ["shovel", 1],
  ]),
  defineItem(
    "gardenfurniture",
    "花园家具",
    "Garden Furniture",
    "gardening",
    21,
    135,
    [
      ["planks", 2],
      ["plastic", 2],
      ["textiles", 2],
    ],
  ),
  defineItem("firepit", "火坑", "Fire Pit", "gardening", 28, 240, [
    ["bricks", 2],
    ["shovel", 1],
    ["cement", 2],
  ]),
  defineItem("lawnmower", "割草机", "Lawn Mower", "gardening", 30, 120, [
    ["metal", 3],
    ["paintbucket", 1],
    ["electricalcomponents", 1],
  ]),
  defineItem("gardengnomes", "花园侏儒", "Garden Gnomes", "gardening", 34, 90, [
    ["cement", 2],
    ["glue", 1],
  ]),

  defineItem("donuts", "甜甜圈", "Donuts", "donut-shop", 18, 45, [
    ["flourbags", 1],
    ["sugarspices", 1],
  ]),
  defineItem(
    "greensmoothie",
    "绿色果昔",
    "Green Smoothie",
    "donut-shop",
    20,
    30,
    [
      ["vegetables", 1],
      ["fruitberries", 1],
    ],
  ),
  defineItem("breadroll", "面包卷", "Bread Roll", "donut-shop", 24, 60, [
    ["flourbags", 2],
    ["cream", 1],
  ]),
  defineItem(
    "cherrycheesecake",
    "樱桃芝士蛋糕",
    "Cherry Cheesecake",
    "donut-shop",
    27,
    90,
    [
      ["flourbags", 1],
      ["fruitberries", 1],
      ["cheese", 1],
    ],
  ),
  defineItem(
    "frozenyogurt",
    "冻酸奶",
    "Frozen Yogurt",
    "donut-shop",
    28,
    240,
    [
      ["fruitberries", 1],
      ["cream", 1],
      ["sugarspices", 1],
    ],
  ),
  defineItem("coffee", "咖啡", "Coffee", "donut-shop", 33, 60, [
    ["cream", 1],
    ["seeds", 2],
    ["sugarspices", 1],
  ]),

  defineItem("cap", "帽子", "Cap", "fashion", 19, 60, [
    ["textiles", 2],
    ["measuringtape", 1],
  ]),
  defineItem("shoes", "鞋子", "Shoes", "fashion", 21, 75, [
    ["textiles", 2],
    ["plastic", 1],
    ["glue", 1],
  ]),
  defineItem("sunglasses", "手表", "Watch", "fashion", 22, 90, [
    ["plastic", 2],
    ["glass", 1],
    ["chemicals", 1],
  ]),
  defineItem(
    "businesssuits",
    "商务套装",
    "Business Suits",
    "fashion",
    32,
    210,
    [
      ["textiles", 3],
      ["measuringtape", 1],
      ["glue", 1],
    ],
  ),
  defineItem("backpack", "背包", "Backpack", "fashion", 34, 150, [
    ["textiles", 2],
    ["plastic", 2],
    ["measuringtape", 1],
  ]),

  defineItem(
    "icecreamsandwich",
    "冰淇淋三明治",
    "Ice Cream Sandwich",
    "fast-food",
    25,
    14,
    [
      ["breadroll", 1],
      ["cream", 1],
    ],
  ),
  defineItem("pizza", "披萨", "Pizza", "fast-food", 28, 24, [
    ["flourbags", 1],
    ["cheese", 1],
    ["beef", 1],
  ]),
  defineItem("burgers", "汉堡", "Burgers", "fast-food", 31, 35, [
    ["beef", 1],
    ["breadroll", 1],
    ["bbqgrill", 1],
  ]),
  defineItem("cheesefries", "芝士薯条", "Cheese Fries", "fast-food", 33, 20, [
    ["vegetables", 1],
    ["cheese", 1],
  ]),
  defineItem(
    "lemonadebottles",
    "柠檬水",
    "Lemonade Bottle",
    "fast-food",
    37,
    60,
    [
      ["glass", 2],
      ["sugarspices", 2],
      ["fruitberries", 1],
    ],
  ),
  defineItem("popcorn", "爆米花", "Popcorn", "fast-food", 43, 30, [
    ["microwaveoven", 1],
    ["corn", 2],
  ]),

  defineItem(
    "bbqgrill",
    "烧烤炉",
    "BBQ Grill",
    "home-appliances",
    29,
    165,
    [
      ["metal", 3],
      ["cookingutensils", 1],
    ],
  ),
  defineItem(
    "refrigerator",
    "冰箱",
    "Refrigerator",
    "home-appliances",
    35,
    210,
    [
      ["plastic", 2],
      ["chemicals", 2],
      ["electricalcomponents", 2],
    ],
  ),
  defineItem(
    "lightingsystem",
    "照明系统",
    "Lighting System",
    "home-appliances",
    36,
    105,
    [
      ["chemicals", 1],
      ["glass", 1],
      ["electricalcomponents", 1],
    ],
  ),
  defineItem("tv", "电视", "TV", "home-appliances", 38, 150, [
    ["plastic", 2],
    ["glass", 2],
    ["electricalcomponents", 2],
  ]),
  defineItem(
    "microwaveoven",
    "微波炉",
    "Microwave Oven",
    "home-appliances",
    42,
    120,
    [
      ["metal", 4],
      ["glass", 1],
      ["electricalcomponents", 1],
    ],
  ),
];

export const itemById: Record<ItemId, ProductionItem> = Object.fromEntries(
  items.map((item) => [item.id, item]),
);

export const categoryById: Record<CategoryId, Category> = Object.fromEntries(
  categories.map((category) => [category.id, category]),
) as Record<CategoryId, Category>;
