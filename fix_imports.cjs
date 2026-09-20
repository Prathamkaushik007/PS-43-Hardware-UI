const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, regex, replacement) {
    const fullPath = path.join(__dirname, '../kiosk', filePath);
    try {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(regex, replacement);
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed ${filePath}`);
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e);
    }
}

replaceInFile('src/admin/pages/AdminDashboard.tsx', /import type \{[ ]*\} from '\.\.\/types';/, "import type { Kiosk } from '../types';");
replaceInFile('src/admin/pages/KioskManagement.tsx', /import type \{[ ]*\} from '\.\.\/types';/, "import type { Kiosk } from '../types';");
replaceInFile('src/admin/pages/KioskScreenEditor.tsx', /import type \{[ ]*\} from '\.\.\/types';/, "import type { Kiosk, KioskConfiguration } from '../types';");
replaceInFile('src/admin/services/ConfigurationRepository.ts', /import type \{[ ]*\} from '\.\.\/types';/, "import type { Kiosk, KioskConfiguration } from '../types';");
replaceInFile('src/admin/services/MockConfigurationService.ts', /import type \{[ ]*\} from '\.\.\/types';/, "import type { Kiosk, KioskConfiguration } from '../types';");
replaceInFile('src/admin/services/MockConfigurationService.ts', /import type \{[ ]*\} from '\.\/ConfigurationRepository';/, "import type { ConfigurationRepository } from './ConfigurationRepository';");
