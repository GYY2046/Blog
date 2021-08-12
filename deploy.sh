# 确保脚本抛出遇到的错误
set -e

# 打包生成静态文件
npm run build

# 进入打包好的文件夹
cd docs/.vuepress/dist

# 创建git的本地仓库，提交修改
git init
git add -A
git config user.email 'gyy2046@outlook.com'
git config user.name 'gyy2046'
git commit -m 'deploy'

# 覆盖式的将本地仓库发布至github
git push -f  git@github.com:GYY2046/GYY2046.github.io.git master

cd -
