const fs = require('fs');
const path = require('path');

const uiDir = 'G:/Kerja IT/PSM/bijakbeli/UI';
const srcDir = 'G:/Kerja IT/PSM/bijakbeli/mobile/src';

const screensDir = path.join(srcDir, 'screens');
const themeDir = path.join(srcDir, 'theme');
const componentsDir = path.join(srcDir, 'components');

if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });
if (!fs.existsSync(themeDir)) fs.mkdirSync(themeDir, { recursive: true });
if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir, { recursive: true });

// Read theme.js
const themeCode = fs.readFileSync(path.join(uiDir, 'theme.js'), 'utf-8');
fs.writeFileSync(path.join(themeDir, 'theme.js'), themeCode);

// BottomNav.js
let bottomNavCode = fs.readFileSync(path.join(uiDir, 'BottomNav.js'), 'utf-8');
bottomNavCode = bottomNavCode.replace(/from '\.\/theme'/g, "from '../theme/theme'");
bottomNavCode = bottomNavCode.replace(/export default function BottomNav\(\{ active = 'Home', onNavigate = \(\) => \{\} \}\) \{/, `import { useNavigation } from '@react-navigation/native';

export default function BottomNav({ active = 'Home' }) {
  const navigation = useNavigation();
  const onNavigate = (key) => {
    if (key === 'Home') navigation.navigate('HomeDashboard');
    else if (key === 'Compare') navigation.navigate('SearchGrocery');
    else if (key === 'Budget') navigation.navigate('ShoppingList');
    else if (key === 'Profile') navigation.navigate('Login');
  };`);
fs.writeFileSync(path.join(componentsDir, 'BottomNav.js'), bottomNavCode);

const processScreen = (filename) => {
  let code = fs.readFileSync(path.join(uiDir, filename), 'utf-8');
  code = code.replace(/from '\.\/theme'/g, "from '../theme/theme'");
  code = code.replace(/from '\.\/BottomNav'/g, "from '../components/BottomNav'");

  if (filename === 'SplashScreen.js') {
    code = code.replace(/export default function SplashScreen\(\) \{/, `import { useEffect } from 'react';
export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation?.replace('Login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);`);
  }

  if (filename === 'HomeDashboardScreen.js') {
    code = code.replace(/{ key: 'Search', label: 'Search', icon: 'search-outline' }/, "{ key: 'Search', label: 'Search', icon: 'search-outline', route: 'SearchGrocery' }");
    code = code.replace(/{ key: 'Scan', label: 'Scan', icon: 'scan-outline' }/, "{ key: 'Scan', label: 'Scan', icon: 'scan-outline', route: 'HomeDashboard' }");
    code = code.replace(/{ key: 'MyList', label: 'My List', icon: 'list-outline' }/, "{ key: 'MyList', label: 'My List', icon: 'list-outline', route: 'ShoppingList' }");
    code = code.replace(/{ key: 'Promotions', label: 'Promotions', icon: 'pricetags-outline' }/, "{ key: 'Promotions', label: 'Promotions', icon: 'pricetags-outline', route: 'WeeklyPromotions' }");
    
    code = code.replace(/<TouchableOpacity key=\{action\.key\} style=\{styles\.quickAction\}>/, `<TouchableOpacity key={action.key} style={styles.quickAction} onPress={() => navigation.navigate(action.route)}>`);
  }

  fs.writeFileSync(path.join(screensDir, filename), code);
};

const screens = [
  'SplashScreen.js',
  'LoginScreen.js',
  'HomeDashboardScreen.js',
  'SearchGroceryScreen.js',
  'PriceComparisonScreen.js',
  'WeeklyPromotionsScreen.js',
  'ShoppingListScreen.js'
];

screens.forEach(processScreen);
console.log('Done mapping files!');
