import util from 'util';
import fs from 'fs';
import { exec } from 'child_process';

const readFileAsync = util.promisify(fs.readFile);
const execAsync = util.promisify(exec);

export default function buildInfoPlugin() {
  return {
    name: 'build-info',
    async closeBundle(options, bundle) {
      try {
        if (process.argv.includes('build')) {
          let { stdout: buildPerson } = await execAsync('git config user.name');
          buildPerson = buildPerson.trim();
          const buildTime = new Date().toLocaleString();

          const data = await readFileAsync('.git/HEAD', 'utf8');
          const branch = data.match(/ref: refs\/heads\/(.*)/)[1];

          const configData = await readFileAsync('.git/config', 'utf8');
          const match = configData.match(/\[remote "origin"\]\s+url\s*=\s*(.*)/);
          const remoteUrl = match ? match[1] : '';
          const repository = remoteUrl.split('/').pop().replace('.git', '');

          const scriptContent = `
          <script>
            console.log('打包时间: ${buildTime}');
            console.log('打包人: ${buildPerson}');
            console.log('仓库: ${repository}');
            console.log('分支: ${branch}');
          </script>
        `.trim();

          // 将scriptContent插入到打包后的index.html文件
          const indexPath = 'dist/index.html';
          let indexContent = fs.readFileSync(indexPath, 'utf8');
          indexContent = indexContent.replace('</body>', `${scriptContent}\n</body>`);
          fs.writeFileSync(indexPath, indexContent);
          console.log('build-info-plugin: 插入build信息成功!');
        }
      } catch (error) {
        console.error(error);
      }
    }
  };
}
