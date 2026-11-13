# 上传 GitHub Pages 与安装为 PWA

## 1. 本地预览

```bash
python -m http.server 4173
```

打开 `http://127.0.0.1:4173/`。不要直接双击 `index.html`，否则麦克风和 Service Worker 可能不可用。

## 2. 上传到 GitHub

1. 登录 GitHub，点击右上角 `+` → `New repository`。
2. 仓库名填 `english-daily`，选择 `Public`，不要勾选初始化 README。
3. 创建后进入 `Add file` → `Upload files`，把本项目根目录下的文件全部上传：
   - `index.html`
   - `app.css` / `styles.css` 所在目录
   - `js/`、`icons/`、`assets/`
   - `manifest.webmanifest`、`sw.js`、`.nojekyll`
   - `README.md`、`VERSION`、`CHANGELOG.md` 等
4. 页面底部点击 `Commit changes`。

有 Git 的情况下也可以：

```bash
git init
git add .
git commit -m "EnglishDaily: 外研版词汇听读 PWA"
git branch -M main
git remote add origin https://github.com/你的用户名/english-daily.git
git push -u origin main
```

> 首次 push 会要求登录。可以用 Git Credential Manager 浏览器登录，或在密码处粘贴 GitHub Personal Access Token。网页上传不支持嵌套文件夹时，请保持 `js/`、`icons/`、`assets/` 的目录结构。

## 3. 开启 GitHub Pages

1. 仓库 `Settings` → `Pages`。
2. `Source` 选 `Deploy from a branch`。
3. 分支选 `main`，目录选 `/ (root)`，保存。
4. 等待 1–3 分钟，访问：

```text
https://你的用户名.github.io/english-daily/
```

如果 404，检查 `index.html` 是否在仓库根目录、仓库是否 Public、Pages 是否显示已发布。

## 4. 安装到手机主屏幕

用 Android Chrome 打开 Pages 地址，右上角菜单 → `添加到主屏幕` / `安装应用`。  
iPhone Safari 用分享按钮 → `添加到主屏幕`。

Service Worker 需要 HTTPS（GitHub Pages 默认提供），本地预览用 `localhost` 也可以。

## 5. 打包 APK（可选）

先用 GitHub Pages 部署出 HTTPS 地址，然后任选：

- PWABuilder：输入站点地址，生成 Android 包。
- Bubblewrap：

```bash
bubblewrap init --manifest https://你的用户名.github.io/english-daily/manifest.webmanifest
bubblewrap build
```

本项目没有内置签名密钥；正式发布 APK 前请自行配置签名。

## 6. 更新版本

修改词库或前端后：

1. 更新 `VERSION` 和 `CHANGELOG.md`。
2. 修改 `sw.js` 里的 `CACHE_NAME`（例如 `english-daily-v1.3.1`），避免用户继续使用旧缓存。
3. 重新提交并 push。
