# 更新日志

## 0.11.0 (2026-11-16)

- **Serverless Framework 的接口上了地图：** 接口写在 `serverless.yml` 里、而不是写在代码里的后端，以前一个都不显示，所以网站对它的请求连不上，健康检查也跳过了登录检查。现在接口来自每个函数的 `http` 和 `httpApi` 事件（`path` 和 `method`、`any` 和 `*`，以及短写法 `http: GET /orders`），在 `serverless.yml`、`serverless-*.yml` 和 `serverless_*.yml` 里，包括用 `${file(./functions.yml)}` 拆到多个文件的函数名单。每个接口坐在它的 `handler:` 点名的那个文件里（`src/orders.create` 是 `src/orders.ts` 里的 `create`），会跟着一个再导出它的文件走，处理函数只是把请求转交时，就坐进另一个文件的函数里（`(event) => withEvent(event, options, orders.create)`）。健康检查把 `authorizer`、`private: true`（一把 API 密钥），或交给包装函数的登录检查，当成这个接口有保护，并且仍会去读处理函数自己有没有检查。CloudFormation 标签（`!Ref`、`!GetAtt`、`!Sub`）、`${opt:…}` 和 `${self:…}` 变量以及锚点都能读，扫描摘要会把定时、队列、流和其他后台函数列给一个后台节点。测试文件夹里的样例配置不加接口。由 @ShehanEk 在 #131 和 #132 报告并修复。
- **Supabase Edge Functions 上了地图：** 服务器代码住在 Supabase Edge Functions 里的应用，以前不显示接口，所以网站对它们的调用连不上，健康检查的登录检查也没什么可看。现在 `supabase/functions/` 下的每个文件夹是 `/functions/v1/<名字>` 上的一个接口（`Deno.serve`，或 Deno 标准库的 `serve()`），放在提供它的那一行上。函数自己带一个路由器（Hono 以及类似的）时，那个路由器的接口显示在 `/functions/v1` 下面。以 `_` 开头的文件夹，比如 `_shared`，不是函数。网站的 `supabase.functions.invoke('send-invite')` 调用（除非选项给了别的方法，否则是 POST）和对 `${SUPABASE_URL}/functions/v1/send-invite` 的请求会到达它们。健康检查读每个函数自己的代码里有没有登录检查，比如 `supabase.auth.getUser()`。Supabase 的 `verify_jwt` 不算，因为网站带着的那把公开 anon 密钥过得了那一关。由 @jstncrwn 在 #54 报告。
- **普通 PHP 站点的页面成了接口：** 没有框架的 PHP 站点，每个请求由那个地址上的脚本应答。Floorplan 以前不把这读成接口，所以页面一个都不显示，网站对它们的请求（`fetch('/orders/save.php')`）也连不上。现在文档根（`public/`、`public_html/`、`www/` 或 `htdocs/`）下的每个脚本是它自己地址上的一个接口，文件夹里的 `index.php` 在那个文件夹的地址上。别的脚本 include 的脚本，以及 `_` 或点开头的文件夹，不是页面。文档根的 `index.php` 如果加载了 Composer 的自动加载器（Laravel、Symfony、Slim），就留给那个框架。健康检查还不会判断它们的登录。由 @maccydee 在 #12 提出，文档根这条规则来自他们的 #13。
- **地址有一段要到后来才填上时，请求又能对上对的接口：** 从 0.10.0 起，像 ``fetch(`/api/users/${user.id}`, { method: "PATCH" })`` 这样的请求，可能被连到旁边一个写死的接口 `GET /api/users/stripe`，而不是 `PATCH /api/users/[userId]`。学会客户端的基地址（0.10.0 新加的）让那个基地址下面更松的匹配又挤到了最好的那个旁边。现在基地址下面最好的匹配排在前面，只有它们一个都不在这个基地址下时，更松的那个才来顶上。请求的方法也会从地址下面几行才开始的选项里读，`fetch` 通常就是这样写的；以前这种算成读取。
- **别的语言里的占位符不再当成密钥：** 健康检查以前只在英语里认识 "your key here" 和 "change me"，所以 `SECRET_KEY: troque-esta-chave-2024` 或 `APP_PASSWORD="sua_senha_aqui"` 这种值会被报成写进代码的密钥。葡萄牙语、西班牙语、法语和德语里的同样意思现在也标成占位符（`sua`、`aqui`、`troque`、`defina`、`tu`、`cambia`、`votre`、`ici`、`changez`、`dein`、`hier` 以及其他），而且只认整词，所以一把碰巧含着这些字母的随机密钥仍会被找到。数据库安装脚本里，没空格写下的 psql 变量（`PASSWORD:'app_password'`）和一行 SQL 注释（`-- password = …`）也不再算。由 @auroraferraz 在 #107 和 #108、@jeanlima17-cmd 在 #110 报告。
- **地图点出真正在回答问题的那个程序：** 别的程序装在 `claude` 这个命令下面时，打开地图会印出 `ASK  works: questions run through the Claude Code CLI (devin 3000.11.238)`。程序的版本点的是别的名字时，这一行现在会说出来：`questions run through devin, found as the claude command`。这两句是程序打印的固定英文。由 @fjjjuv 在 #95 报告，@1oridevs 在 #97 给了第一版修复。

## 0.10.0 (2026-11-15)

- **一个不常见的字母不再把地图弄成空白：** 为了在内容安全策略里列出这页自己的脚本，构建会读页面的一份小写副本。有几个字母变成小写后会变长（土耳其语的 "İ" 变成两个字符）。脚本前面任何地方有一个，不管是扫描带上的注释、文件名还是说明，都会让后面每个脚本在那份副本里错开一个字符，指纹就不对，浏览器拦住它们，地图什么都不画。现在只把 A 到 Z 变成小写，和浏览器读标签名的方式一样，所以副本始终和页面对齐。由 @OfficialCodeVoyage 在 #118 修复。
- **写成对象的 Fastify 路由能找到了：** 把接口写成 `app.route({ method: 'POST', url: '/api/orders', handler })` 的 Fastify 服务器，以前地图上一个都没有。现在文件做出的任何路由器都算（`const api = Fastify()`），`method` 是一份列表时每个方法一个接口，路由上的 `preHandler`、`onRequest` 或 `preValidation` 检查只保护那一条路由。路由的 `schema` 里面的一个键，以及没写出来的 `method` 或 `url`，不会变成接口。由 @Bl0ck154 在 #34 修复。
- **NestJS 的接口上了地图：** NestJS 服务器以前一个接口都不显示，所以网站对它的请求连不上，健康检查也说不出哪些接口谁都能调用。现在接口来自 `@Controller('prefix')`（或 `@Controller({ path })`），以及方法上的 `@Get`、`@Post`、`@Put`、`@Patch`、`@Delete`、`@All`、`@Options` 和 `@Head` 装饰器，各自带着处理函数，在引用了 `@nestjs/common` 的文件里。一个文件里有好几个控制器，或一个控制器后面还有另一个类，每个接口仍留在它自己的控制器下，并以它自己的方法命名。健康检查读方法或它的类上的 `@UseGuards(...)`、整份应用的登录守卫（模块里的 `{ provide: APP_GUARD, useClass: AuthGuard }`，或 `main.ts` 里的 `app.useGlobalGuards(new JwtAuthGuard())`），以及像 `@Public()` 那样让一条路由绕过它的装饰器（一条公开路由如果自己检查令牌或签名，仍算查过）。整应用的守卫只保护 Nest 的控制器，不保护同一个仓库里的 Express 或 Next.js 服务器。限流和配额守卫，或名字没说出它在查什么的（`MaintenanceGuard`），不算登录检查。运行时才设的全局前缀（`app.setGlobalPrefix`）还看不见。由 @stefantalos 在 #111 修复，好几个控制器的修复和样例来自 @BestShuffle 的 #82。
- **写成数据的接口能找到了：** 有些服务器把接口放在一份名单里，由一个分发器去读，比如 `[{ method: "GET", path: "/api/items", handle: listItems }]`。路径可以是正则（`/^\/api\/items\/([^/]+)$/` 是 `/api/items/:p1`，`(?:items|products)` 每个词一个接口）。Bun 服务器在 `Bun.serve({ routes })` 里声明自己的。这些以前地图上没有接口。现在每一个都是接口，以它的处理函数命名，网站的请求会连上它。网站自己发出的请求名单（`{ method, path, action: 'createOrder' }`，或 `resolve` 和 `fetch` 函数）不会被当成路由：`action`、`resolve` 和 `fetch` 只在一个会提供服务的文件里、或挨着带 `handle` 的条目时才算，而且值必须是函数。变不成一条清楚路径的模式会丢掉，而不是让它匹配一切。和按方法、路径当键的路由表一样，健康检查不判断它们的登录，那发生在分发器里。由 @maxschuetz06 在 #29 修复。
- **Angular 的路由文件不再被当成接口：** 在 `src/app/` 下，一个名字只是以 `route.ts` 结尾的文件（Angular 的 `orders.route.ts`）以前被读成 Next.js 的路由处理，于是显示成一个 `GET` 接口，健康检查把整个 Angular 应用的接口都报成谁都能用。现在只有名字恰好是 `route.ts` 的文件才是 Next.js 的路由处理。由 @BestShuffle 在 #84 修复。
- **带了要参数的检查的 FastAPI 路由器：** 像 `APIRouter(dependencies=[Depends(require_workspace("tours"))])` 这样的路由器，检查的工厂被带着参数调用时，以前只读到第一个 `)`，登录检查就漏了，它的路由全被报成敞开。现在整段 `APIRouter(...)` 都会读，只叫 `authenticate` 或 `authorize` 的检查也算。只出现在它里面的注释或字符串里的检查，仍然什么都不保护。由 @spacecampkatie 在 #73 修复。
- **通过应用自己的帮手发出的请求能找到了：** `apiGet('/tasks')`、`` apiSend('PATCH', `/tasks/${id}`, body) `` 或 `httpPost('/orders')` 这样的调用现在是网页请求，方法从帮手的名字或它的第一个参数来。一个手机应用如果全部用这种方式调用，以前几乎一个都不显示。由 @Basel-Alsemsam 在 #105 修复。
- **客户端的基地址赢过一个看起来更近的匹配：** 一个客户端的其他调用都走在同一个基地址下（它的基址 URL 含着 `/api/v2`）时，像 `/tasks/${id}` 这样的地址现在到达 `/api/v2/tasks/:id`，而不是 `/tasks/:id` 上的一个网站页面，哪怕两个都在同一个服务器文件里。基地址只从「每一个同样好的匹配都同意」的那些调用来学，所以一次含糊的调用教不会错误的那个。一个应用教出来的基地址只和那个应用自己的文件共享（有它的 package.json 的文件夹，或它的仓库），从不跟旁边的另一个应用共享。由 @Basel-Alsemsam 在 #105 修复。
- **由服务方法拼出来的请求：** Angular 的服务（或任何类）在方法里拼地址，比如 `this.http.post(this.url(id, '/ship'), {})`，而 `url()` 返回一个模板字符串，现在这些请求上了地图，包括建立在另一个方法上的（`itemUrl()` 调用 `url()`）。以前它们会被漏掉，或只凭最后一段对到错误的接口（`/ship`）。由 @BestShuffle 在 #83 修复。
- **地址在下一行的请求：** `this.http.patch<Order>(` 而地址在下面一行，现在算，并且带着它的方法。以前这种请求只有地址碰巧含着 `api` 或 `base` 这类词才找得到。由 @BestShuffle 在 #83 修复。
- **Swift 应用有了连线：** Swift 文件以前一条连线都没有，因为 Swift 的 `import` 点的是模块而不是文件，同一个模块的文件互相用代码时什么都不用 import。Floorplan 现在读每一份 `Package.swift`，找出每个目标的文件夹（它的 `path:`，或 `Sources/<名字>` 和 `Tests/<名字>`），并把一个文件连到声明了它用到的类型、类型别名、函数和值的那些文件，在它自己的模块里，也在它 import 的模块里（包括 `@testable import`）。没有包的 Xcode 应用算成一个模块，所以它的文件夹也会互相连。嵌套的和私有的声明留在外面，所以 `Kind` 或 `State` 这种常见名字不会把不相干的文件连上。文件自己的模块声明的名字，赢过它 import 的模块里的同名。只有测试会连到测试帮手。文件 import 了一个模块、却没用到任何看得见的东西（比如只用了它的扩展）时，不连一条随便挑的线。Apple 的框架不进地图，其他包（比如 Sparkle）显示成外面的包。类、结构体、枚举、协议和 actor 列在每个文件的卡片上，协议和 actor 用类型图标。由 @JohannDesobry 在 #79 贡献。
- **Shopify 主题能画了：** 主题的 Liquid 文件以前完全不读，所以地图上几乎什么都没有。现在有 `layout/theme.liquid` 的文件夹按主题来读，文件按 Shopify 加载它们的方式、靠名字连上：`{% render %}` 到片段，`{% section %}` 和 `{% sections %}` 到分区和分区组，`{% content_for 'block' %}` 到主题块，`asset_url` 到资源。JSON 模板和分区组用它们列出的分区和主题块，包括打进自定义代码设置里的 Liquid。以应用块或嵌入加进来的应用显示成外面的包（`shopify-app:<应用>`）。每个模板是 **页面** 名单上的一页（用 `?view=` 打开的备用模板也是）。片段和分区显示它们的 `{% doc %}` 或注释说明，以及结构里的块。健康检查列出没有任何东西渲染或点名的片段。主题的 Liquid 文件和 JSON 模板算代码，所以它们在地图上，不再落在 `NOT MAPPED` 下面。主题以外的 `.liquid` 文件（Jekyll、Eleventy）仍按原来的方式。由 @turbo-42 在 #80 提出，并由他们在 #81 加上。
- **ASP.NET Core 后端能画了：** Floorplan 以前在 C# 后端里找不到接口，所以一个网站和它的 ASP.NET Core API 显示成两座岛，中间什么都没有。现在控制器动作（`[Route]`、`[HttpGet]` 和其他动词，`[controller]`、`[action]` 和 `[area]` 会填上）、控制器从基类控制器继承来的动作、通过 `MapControllerRoute` 到达的控制器、最小 API（`app.MapGet(…)`，在它们的 `MapGroup` 前缀下，也包括在它们自己的方法里登记的）和 SignalR 枢纽都是接口，各自从它的 `<summary>` 起名和写说明。网站的请求不管大小写都能到达它们，和 ASP.NET Core 的路由一样（`/api/orders` 找得到 `OrdersController`）。别的框架仍精确匹配。.NET 测试项目里的接口（`Orders.Api.Tests/`）不进地图。由 @Joren-vanGoethem 在 #27 报告，并由他们在 #28 修复。
- **C# 文件连上了：** 一个 `using` 把文件连到那个命名空间里、声明了它用到的类型的那些文件，所以一个 `using` 不会把整个命名空间都连上。`global using` 在它的项目里都算（它的 `.csproj` 所在的文件夹）。`System` 和 `Microsoft.AspNetCore` 算内建的，其他命名空间显示成 NuGet 包。由 @Joren-vanGoethem 在 #28 修复。
- **健康检查会看 ASP.NET Core 应用：** 它报告谁都能用的接口，读动作、它的控制器或基类控制器上的 `[Authorize]` 和 `[AllowAnonymous]`，不管隔了多少层类；读你自己建在 `AuthorizeAttribute` 上的特性；读接口或它的组上的 `.RequireAuthorization()` 和 `.AllowAnonymous()`；读自己检查调用者的处理函数（另一个文件里的也算）；以及整份应用的后备策略。后备策略只盖住它自己的项目，所以一个服务的策略藏不住另一个服务敞开的接口。`[AllowAnonymous]` 表示故意公开，不报告。它也会找到让每个网站都能调用服务器的 CORS、从不核对 Stripe 签名的 Stripe 到账通知（修复步骤按 ASP.NET Core 来写），以及 .NET 连接串里的数据库密码（`Server=…;Password=…`）。这台电脑、变量、占位符和编造的值会放过，和其他密钥一样。由 @Joren-vanGoethem 在 #28 修复。
- **PHP 和 Laravel 应用有了真正的地图：** Laravel 应用以前不显示接口，PHP 文件也没有连线，因为 Floorplan 只跟着 `require` 走。由 @epistex-dev 在 #67 报告，由 @Basel-Alsemsam 在 #106 修复。现在：
  - **PHP 文件连到它们用到的类**：`use` 语句（分组的和起了别名的也算）、trait，以及没写 `use` 就点名的类（`new Order`、`Order::class`、参数类型、`extends`），按命名空间找，也通过 `composer.json` 的 PSR-4 文件夹找。外面的包按厂商命名（`composer:Illuminate`）。PHP 只读，从不运行。
  - **Laravel 接口带着完整地址**：`Route::get/post/…`、`match`、`resource` 和 `apiResource`（带 `only` / `except`）、`Route::view` 和 `Route::inertia`，在前缀、名字、中间件和控制器组下面。在组里面加载的路由文件（`require`、`->group(base_path(…))`、在固定名单上循环 require 的文件、`bootstrap/app.php` 里的 `withRouting`）得到那个组的前缀、名字和中间件。
  - **每个接口坐在应答它的控制器方法里**，带着那个方法的文档注释，所以请求通向处理它们的代码，而不是通向路由文件。
  - **Laravel 的 Wayfinder 调用**（`import { show } from '@/routes/orders'`、`OrderController.update.form(…)`）按路由名或控制器方法到达接口，尽管 Wayfinder 生成的文件不在 git 里。一个名字定义了两次时，保持不连，不去猜。
  - **Inertia 页面是页面**：一个控制器方法渲染一页，就让它成为接口地址上的一个页面，控制器和它的数据在背后。
  - **健康检查谁可以调用每个 Laravel 接口**：路由上的中间件、它的组、以及围着它的路由文件（通过应用自己的别名和组）、控制器自己的中间件、`authorize()` 会看用户的表单请求，以及方法里面的检查（`$this->authorize`、`Gate::`、`abort_unless(…, 403)`）。登录页（`guest`）、只做重定向或回答固定内容的闭包，以及普通页面，不报告。每个敞开接口的修复会点出它登记在哪个文件。
  - **扫描说出它找到了什么**：一行 `LARAVEL`，带着接口、它们来自哪些路由文件、连上的 Wayfinder 调用和 Inertia 页面，以及没有任何东西加载的路由文件。`--json` 把这些连线计成 `wayfinderLinks` 和 `inertiaPages`。
- **隐私、条款和法律页面是故意公开的：** 健康检查不再把读取站点的 `/privacy`、`/privacy-policy`、`/terms`、`/terms-of-service`、`/tos`、`/legal` 或版本说明页报成谁都能用。只有读取算，而且只有整段地址就是那一页时才算（`/legal/imprint` 也算）。所以别人的隐私设置（`/account/privacy`）、法律地址下的数据（`/api/legal/cases`）、像 `/api/privacy-requests` 这样的请求，以及对那些页面的修改，仍会查。由 @Basel-Alsemsam 在 #106 修复。
- **健康检查会注意到自己应答请求的 PHP：** **查过什么** 在 JavaScript、Python 或 Go 代码看起来在跑服务器、却没找到接口时会突出，对 PHP 以前没有特别说法。现在自己读请求的 PHP（`$_POST`、`$_GET`、`$_SERVER['REQUEST_METHOD']`），或声明了 Floorplan 还不会读的路由的 PHP（Symfony 的 `#[Route]`、Slim 的 `$app->get('/…')`），也会让那一行突出，并点出文件。注释或字符串里提一句、Blade 模板、测试，或容器的 `$app->get('config')`，不算。

## 0.9.0 (2026-11-14)

- **Flask 的登录检查认得了：** 由 `@login_required`、`@login_required_json` 或 `@logged_in_required` 保护的路由以前被报成敞开，因为以 "log" 开头的名字被当成了记日志的装饰器。`@log_call` 这类记日志的装饰器仍不算登录检查，放在路由上面的登录装饰器仍是一条警告。由 @SmmSrg 在 #123 报告，由 @daniyyell-dev 在 #125 修复。
- **由一个 HTTP 中间件保护的 FastAPI 应用：** 一个 `@app.middleware("http")` 函数把调用者挡回去（401 或 403 响应，或 `HTTPException`），现在算这个应用的登录检查，所以它的接口不再被报成谁都能用。和 Flask 已经有的 `@app.before_request` 同一套办法。只加头、计时，或从响应里读一个 401 的中间件，仍然什么都不保护，不管它叫什么名字。两者也都不保护同一个仓库里的 JavaScript 服务器。由 @ahmedjanwar 在 #86 报告，并由他们在 #87 修复。
- **名叫 `validate_…` 的 FastAPI 检查：** `Depends(validate_jwt)` 或 `Depends(validate_api_key)` 这样的依赖现在算登录检查。只校验请求形状的，比如 `@validate` 或 `Depends(validate_payload)`，仍然不算。由 @doramirdor 在 #112 报告。
- **FastAPI 的检查按它做什么来判断，不只看名字：** 检查是工厂的结果时（`editor = require_role("editor")`，然后在路由上或整个 `APIRouter` 上 `Depends(editor)`），一个普通名字的依赖用 401 或 403 把调用者挡回去时（`Depends(current_vehicle)`，或 `__call__` 这么做的类），一个 `Depends()` 放在变量里时（`api = Depends(require_key)`，然后 `dependencies=[api]` 或 `_: None = api`），或一份名单放在常量里时（`dependencies=WRITE`），路由以前会被报成敞开。现在这些都算。对调用者什么都不查的依赖，比如页码，或回答 404 的一次查找，不管怎么传，仍然什么都不保护。由 @RoelfA 在 #117、@SomeRandomChad 在 #102 报告。
- **TypeScript 设置来自好几个文件时，引用仍然连着：** `tsconfig.json` 的 `extends` 里的本地数组现在会保留继承来的路径别名。后面的配置和项目自己的设置优先，相对路径保持正确的起点目录。由 @daniyyell-dev 在 #126 报告，由 @daniyyell-dev 在 #127 修复。
- **通过 package.json 的 "imports" 的引用连上了：** 用 Node 的子路径引用的项目，比如 `import { money } from '#lib/money'`，由 `"imports": { "#*": "./src/*" }` 映射，以前自己的文件之间几乎没有连线，地图上的块看起来互不相干，健康检查把大多数文件列成没人用。Floorplan 现在按 Node 的方式跟着最近那份 package.json 的 `imports` 字段走：先精确的键，再最具体的 `*` 键，目标和条件逐个试（`types` 最后，因为 Node 从不选它）。package.json 没有匹配时，tsconfig 的 `paths` 仍然适用。由 @joelbeedle 在 #69 报告，由 @joelbeedle 在 #68 修复。
- **Django 应用之间的 Python 引用连上了：** 应用放在一个包里的项目（`apps/orders/`、`apps/core/`），`from apps.orders.models import Order` 以前被连到引用方自己的 `apps.py`，所以地图上应用之间没有连线，健康检查把用得很多的文件列成没人用。Floorplan 现在会在引用可以起步的每个文件夹里找整个模块，然后才退而接受它的一部分。由 @m1fril 在 #99 报告。
- **Kotlin 和 Java 文件连到它们用的东西：** 一个类、函数、值或类型别名的引用，如果它不按文件名来（Kotlin 文件经常装好几个），以前被列成外面的 Maven 包，常常还是应用自己的（`com.example.app`）。文件从自己的包里用、不需要 import 的代码，则完全不连。所以 Kotlin 文件之间连线很少，说明还说文件没人用。Floorplan 现在知道一个文件里的每个顶层声明，把文件连到它自己的包（以及一个 `.*` 引用）里、它在注释和字符串以外用到了名字的那些文件，并且从不把项目自己的包列成外面的包。私有声明，以及从测试外面用到的测试帮手，不连。由 @RoelfA 在 #115 报告。
- **健康检查里更少的假「密钥」警报：** 一个被传下去的变量（shell 脚本里的 `MYSQL_PWD="$DB_PASSWORD"`、PHP 里的 `"$password"`、Windows 上的 `%DB_PASSWORD%`）、一个像密码的键下面指向项目自己文件的路径（`'confirm_password' => 'resources/js/pages/auth/confirm-password.tsx'`），以及一个普通 `…Token` 名字下面的 ULID 记录 id，不再被报成写进代码的密钥。访问、认证和秘密令牌，不管值看起来像什么，仍会查。由 @Basel-Alsemsam 在 #104 修复，同时修了 #116（由 @BechtelCanDoIt 报告）。
- **更多只是看起来像密钥的值被放过：**
  - 更多写法的变量：Azure Pipelines 和 Makefile 里的 `$(dbPassword)`、Ruby 里的 `#{password}`、几个拼在一起的（`"$DB_USER:$DB_PASSWORD"`），以及数据库安装脚本里的 psql 变量（`-v app_password="$APP_PASSWORD"`，然后 `PASSWORD :'app_password'`）。由 @jeanlima17-cmd 在 #110、@auroraferraz 在 #107 和 #108 的报告引出；
  - 服务做成放进网页的可公开密钥：`pk_…`（Stripe、Clerk 以及其他）、Supabase 的 `sb_publishable_…` 和 PostHog 的 `phc_…`。`sk_…` 密钥仍会标出，碰巧以 `pk_` 开头的密码也仍会标出。由 @notrdd 在 #119 报告；
  - 一个选择的两个答案，比如 `mode === 'signup' ? 'new-password' : 'current-password'`，以及浏览器的自动填充词（`new-password`、`one-time-code`）。由 @adlewis82 在 #93 报告；
  - 里面有一串字母表或数字的编造密钥（`ghp_abcdefghij…0123456789…`），哪怕格式很眼熟。看起来随机的密钥仍会标出，测试文件里的也一样。由 @lexerio-seth 在 #101 报告。
- **更少的文件被错叫成没人用：** Expo Router 按位置找到应用 `app/` 文件夹里的每个文件，所以用了 `expo-router` 的应用里，那些页面不再看起来没人用（Next.js 的 `app/` 文件夹里，或任何别处，剩下的文件仍会）。名字里带点的文件，比如 `users.service.ts`，现在另一个文件点了它的名字（`'./users/users.service'`）就算被用到，和 `users.ts` 已经这样一样。以前那个点把名字藏起来了，所以地图跟不上的 import 所到达的 NestJS 服务和控制器看起来没人用。由 @axelmorand-afk 在 #88 和 #89 报告，带点名字的原因由 @xunguangzlj-cloud 在 #100 找到。
- **在地图上提问不再因为 “Prompt is too long” 失败：** 有两件事会在轮到问题之前把 Claude Code 的上下文填满。电脑上配了很多 MCP 服务器（连接器和插件）时，每个问题都会加载它们每一个的工具说明，尽管回答从不用它们；现在提问完全不带 MCP 服务器跑，每个问题也便宜很多。另外 Claude Code 可能打开地图自己生成的 `floorplan/index.html`（有一回大约 2 MB，全在一行上）；现在吩咐它不要读那个文件，也不要读地图的其他生成文件。Codex 没有一个只关掉 MCP 服务器的开关，所以它仍会加载。由 @Kadreev 在 #66 报告，第二处修复由 @psingh-valorx 在 #120。
- **Windows 上保存的 JSON 文件能用了：** Windows PowerShell 的 `Set-Content` 和 `Out-File`，以及有些编辑器，会在文件开头放一个看不见的字节顺序标记，Floorplan 会停在 `architecture.json is not valid JSON: Unexpected token`。现在你或助手为 Floorplan 写的每个文件（`architecture.json`、`descriptions/`、`recent-work.json`、`plan.json`、保存的流程和健康检查的「不是问题」）有这个标记也照样读。指南也说明了：命令是按 POSIX 外壳写的，和 PowerShell 不一样的地方另有写法。由 @fjjjuv 在 #95 报告，@1oridevs 在 #97 给了第一版修复。
- **地图说出它留在外面的东西：** 除非 `architecture.json` 的 `include` 点了别的种类，否则只画代码。大项目上地图可能看起来太小，像是扫描失败了。扫描和构建现在会说什么不在地图上，例如 `NOT MAPPED  140 asset · 52 docs · 38 config`，以及怎么加一个种类。`--json` 给出同样的计数（`notMapped`）。`NOT MAPPED` 是固定英文。由 @fjjjuv 在 #95 报告。
- **在编辑器里打开，打开的是你的编辑器：** **在编辑器里打开**、**打开处理代码** 和右键那一项以前总是做成 VS Code 链接。现在 `architecture.json` 里的 `"editor"`，或地图服务器上的 `--editor`（`open.mjs` 也会传下去，或 `FLOORPLAN_EDITOR`），可以换一个：一个名字（`cursor`、`windsurf`、`zed`、`vscode-insiders`、`vscodium`、`idea`、`phpstorm`），或你自己的一条链接，比如 `zed://file/{path}:{line}`。只接受编辑器自己的链接方案，从不接受网址、`file:`、`javascript:` 或 `data:` 链接，地图在拼出一条之前会再查一次。VS Code 仍是默认。文件名里有 `#`、`&` 或 `?` 的现在也能正确打开。见[选哪个编辑器](docs/using-the-map.md#choosing-the-editor)。由 @deniskern 在 #122 提出。
- **在循环里打开的行级安全认得了：** 一次给很多张表打开行级安全的 Supabase 迁移（`foreach t in array array['wallets', …] loop execute format('alter table public.%I enable row level security', t); end loop;`）以前让那些表每一张都被报成「谁都能读和改」。循环名单里的名字现在算打开了，事先声明的名单、`FOR … IN SELECT unnest(…)`，以及用 `||` 粘在一起的语句，也算。一次迁移给它没点名的表打开时（比如在 `pg_tables` 上循环），它可能盖到的表会报成「Floorplan 看不出……有没有保护」，值得修，但不是要紧的。做的是别的事的循环，那些表仍按原来的方式报告。由 @doramirdor 在 #113 报告。
- **健康检查说出它查过什么：** 一块干净的健康检查面板，可能是「查过了、没问题」，也可能是「没什么可查」，比如扫描在一个明明有接口的应用里没找到接口。摘要下面，面板现在有 **查过什么**，每项检查一行（接口、Supabase 表、Firebase 规则文件、Stripe 到账通知、为找密钥而读的文件），说出它看了什么，或什么都没找到。代码看起来在跑服务器（`createServer`、`Deno.serve`、一个 Supabase Edge Function）却没找到接口，或应用用了 Supabase 却没找到迁移时，这一行会突出。构建在 HEALTH 下面印出同样的行，`--json` 里是 `health.checked`。HEALTH 和 what was checked 是报告里的固定英文。由 @jstncrwn 在 #53 建议。
- **Nuxt 页面连到它们用到的组件和组合函数：** Nuxt 会自动导入它们，所以页面没有 import 行可跟，大多数页面板只显示页面自己。扫描现在把一个文件连到它的模板用到的组件（`<WorkspaceTeam />`、`<workspace-team>`、`Lazy…`）和它调用的组合函数与工具，名单来自 Nuxt 写到 `.nuxt/components.d.ts` 和 `.nuxt/imports.d.ts` 的那两份（只读这两个文件，`.nuxt/` 不进地图）；应用还没构建时，就按 Nuxt 的文件夹习惯。文件自己 import 或定义的名字会放过。由 @deniskern 在 #121 报告。
- **任何名字的路由器上的 Express 和 Hono 路由：** 扫描以前只读叫 `app`、`router`、`routes` 或 `…Router` 的路由器上的路由，所以一个 Hono 模块的 `export const frentes = new Hono()` 或一个 Express 的 `profileRoutes = Router()` 会丢掉所有接口，健康检查随后可能把应用叫成敞开。现在文件做出的任何路由器上的路由都算。同一个文件里挂进另一个路由器的（`api.route('/frentes', frentes)`）两个前缀都得到。一条路径上的登录检查，比如 `app.use('/api/*', auth)`，保护它下面的接口。由 @gen116sertoes 在 #98 报告，由 @xunguangzlj-cloud 在 #103 修复。
- **Express 接口穿过工厂和索引文件后地址是对的：** 一个没被 import 的挂载名字，比如 `const billingRoutes = createBillingRoutes()`，以前被当成挂载文件自己，于是那个文件提供或挂载的一切都得到错误的前缀（`GET /api/billing/health`），有时还重复好几次。现在挂载会跟着一个返回路由器的函数、一个把路由器转交出去的索引文件（`export { default as authRoutes } from './auth.routes.js'`）、`export *` 和命名空间引用走。交给 `app.use()` 的、不是路由器的名字（中间件、限流器）不会给任何东西加前缀。由 @xumbou 在 #71 报告。
- **敞开的 Express 接口不再被看起来像的中间件藏起来：** 整应用的 `app.use(...)` 以前只要里面任何地方出现一个像守卫的词，就算登录检查，于是健康检查不再报告它后面每一个敞开的接口。字符串里的一个头名字（`cors({ exposedHeaders: ['X-Refreshed-Token'] })`）、一个选项的名字、从不把任何人挡回去的中间件（`cors`、`helmet`、`express-session`、`passport.session()` 以及类似的）或只是加载某个人的（`loadUser`、`optionalAuth`）、一个路由器（`app.use(authRoutes)`）、被注释掉的一行，以及只说了「guard」的名字（`createShutdownGuard()`），不再算。真的检查仍然算，包括列在别的中间件后面的（`app.use(cors(), requireUser)`）、`passport.authenticate('jwt')` 和 `authenticate`，这些以前会漏。有些接口全靠一次整应用的检查来保护时，健康检查面板和构建的摘要会点出它的名字和位置，所以一个干净的结果能看出它靠什么。项目本身就是根上的一个仓库时，「你的接口都不检查是谁在调用」这个标题不再用 `.` 代替名字。由 @xumbou 在 #72 报告，由 @ahmedjanwar 在 #85 修复。

## 0.8.0 (2026-11-12)

- **嵌进去的地图可以把「向地图问这个」交给包着它的页面：** 显示在另一个页面里的导出副本没有提问栏，所以右键菜单里没有提问项。页面现在可以在地图的地址里加上 `ask=host` 来接手。卡片、线和背景上就会出现 **向地图问这个**，并把选中项的 id 和名字用一条 `floorplan:ask` 消息发给那个页面，好让它自己的提问接过去。没带这个打开的地图什么都不变。见[把「向地图问这个」交给外层页面](docs/using-the-map.md#handing-ask-about-this-to-the-page-around-the-map)。

## 0.7.3 (2026-11-10)

- **窗口不够高时，长说明不再盖住地图：** 地图在一个不太高的窗口里打开时（笔记本屏幕，或框在一个框架里），标题的说明可能盖住最上面一排框，因为适配地图时只给标题的一部分留了空。现在整个标题都会留空（最多差一点到窗口的一半）。窗口高度不到 760 像素时，长说明折成三行，带一个展开 / 收起，和手机上已经这样一样。

## 0.7.2 (2026-11-10)

- **Floorplan 装成只读时，第二次构建不再失败：** 构建把两个自己的文件放在地图旁边（`serve.mjs` 和 `page-safety.mjs`），而且是连权限一起复制的。插件的文件是只读的地方（有些包管理器、全系统安装和锁得很死的机器就是这样装的），副本也是只读的，于是下一次构建在替换它们时会停在权限错误（`EACCES` 或 `EPERM`）。现在它们是新写出来的，所以总能替换，早先版本留下的只读副本也会被换掉。
- **`build.mjs --json` 总会打印它的 JSON 对象：** 构建停在它没料到的事上时，以前以退出码 1 结束，标准输出上什么都没有，所以读结果的程序看不出发生了什么。现在它打印通常的那个对象，`ok: false`，以及一条错误，像 `build stopped unexpectedly (EACCES); see stderr`。细节仍去标准错误，绝不进这个对象，因为它们可能引用你的文件。
- **不是对象的说明文件会报告，不再崩溃：** `floorplan/descriptions/` 里一个装着 `null` 的文件，会让构建、刷新和 `describe.mjs` 停在一串堆栈。现在一个文件装着 `null`、一份列表或纯文本，或它的 `files` 或 `routes` 装着列表、数字或文本，是一条点了名的构建错误，像 `descriptions/api.json must be an object like { "files": { … }, "routes": { … } }, not null`。`describe.mjs` 把这样的文件当成空的，并写一份新的来填；刷新把它留给构建去点名。
- **自己延伸自己的 tsconfig 不再让扫描崩溃：** 一份 `tsconfig.json` 或 `jsconfig.json` 的 `extends` 绕回它自己，直接绕或经过别的配置，会让扫描转圈直到栈用完。现在这个圈就在那里结束。

## 0.7.1 (2026-11-10)

- **浏览器拦住存储、复制或新窗口时，地图仍能用：** 嵌在加了沙箱的 iframe 里、在隐私窗口里，或设置很严时。设置现在在这一页开着的时候留着，而不是被重置。「新手导览」不再每次加载都自己开始（按钮仍能开始它，地址里的 `#tour=0` 在任何地方都不让它自己开始）。复制按钮只有文字真的复制了才说「已复制」，否则替你选中。本来会打开新窗口的链接，改成把地址显示出来，而不是什么都不发生。指向地图上一处的链接（`#v=…&s=…`）和嵌进去的办法，现在写在[用地图](docs/using-the-map.md#links-to-a-place-on-the-map)。浏览器允许这些的地方，什么都不变。
- **说明更接近事实：** 地图现在说代码今天做的事，不说它的名字暗示它该做的事。所以一个做了一半的功能读起来是「回复说备注已保存，但还没有存到任何地方」，而不是「保存备注」。写作指南有了新的一节，标题仍是 "Say what it does today"。说明工作表会引用每个接口的代码，以及很短的文件（密钥打码，`.env` 文件从不引用，每个几行），并列出哪些文件引用、请求或点名每个文件，所以不必猜是谁在跑一个脚本。给所有人看的地图上，一块的名字或摘要用了开发者才懂的词（「API client」、「UI kit」、某个框架的名字），或一块里有很多文件、各自待在自己的文件夹里，构建会警告，但从不会因此失败。提醒以 `plain language:` 开头。
- **不是你写的代码的地图更安全，拿去分享的副本也更安全。** 一个仓库，或 AI、人对它写下的一段说明，不能再把地图弄坏、从它漏出去，或让它卡住：
  - **一段古怪的字符串不能再把地图弄成空白：** 接口路径、文件名或说明里的 `<!--<script>` 这类文字，会让浏览器把页面剩下的部分吞掉，地图什么都不画。地图的数据现在放进页面时，把 `<`、`>` 和 `&` 写成转义（还是同一份数据，浏览器不会当成标记）。构建、地图的服务器和它的导出都走同一个帮手。
  - **写进说明的密钥会被藏起来：** 一段说明、标签、摘要、备注或最近改动的条目（或扫描带上的一条注释）里有看起来像密钥或密码的东西，地图显示 «hidden»，构建给出警告，点名文件和字段，但绝不写出值。你的文件保持原样。普通词、文件路径、提交哈希和各种 ID 会放过。驱动可以在写下文字之前，对它调用同一项检查（`maskSecrets`）。
  - **地图带一份内容安全策略：** 只有这页自己的脚本能跑（每个靠它的哈希放行），导出的副本什么都不能联系。所以就算一段脚本不知怎么混了进去，也没法把地图发到别处。`floorplan/` 里的地图，以及地图服务器送出的那一页，只能跟那个本地服务器说话。以前能用的都还一样：提问、流程、即时刷新、导出、候补名单卡片，以及规划蓝图的改规划和撤销。
  - **一个坏的模式是你能修的错误，不是一次崩溃：** `architecture.json` 里不合法的通配（没关上的 `[` 或 `{`、倒过来的范围），或长得离谱、野得离谱的，以前会让构建停在一串堆栈。现在它是一条说出位置的构建错误，像 `nodes[3] ("web").paths[0] "[evil" is not a valid pattern`。
  - **扫描不再卡住：** 一份塞满 `/*` 的大 `tsconfig.json` 会让扫描忙上好几分钟。注释现在一遍就剥掉，超过 1 MB 的配置文件会跳过并记一笔。读代码的那些模式（引用、接口、请求、注释、健康检查、页面）在大文件或古怪的文件上不再突然变慢。
  - **名字不能再装成别的东西：** 看不见的字符，以及会把周围文字顺序倒过来的字符（能让一个文件名读成另一个），在地图上显示成看得见的标记，比如 `[U+202E]`。文件下面仍是真名。
- **更少的错误大白话警告：** 「hook」只在它指 React 那种钩子时才标（「custom hooks」、「the useCart hook」），不指标模板的安装钩子或 git 钩子；「component」和「primitives」只在是页面的那些块上才标（或说得很直白，「UI components」）；「shell」只在「app shell」里才标，不指 shell 脚本。这些英文词是检查认的，不是要你写进地图的。
- **改写措辞从不让地图失败：** 工作流文件里，把构建标出来的标签和摘要改写掉的那一步，现在是可选的，而且只能改措辞。模型没有给出合法答案、改了别的东西，或改写后的文件构建不了，就把更早的那份 architecture.json 放回去，地图继续。工作流格式多了 `optional`、`restore`、`onFail`、`minAttempts`，以及一个作业的 `onlyChange`（[不在对话里跑](docs/unattended.md#the-workflow-file)）。

## 0.7.0 (2026-11-09)

- **不在对话里也能跑 Floorplan：** 在自动检查里、在脚本里，或从你自己的工具，用任何能读文件并返回 JSON 的模型。见[不在对话里跑](docs/unattended.md)。
  - **无人值守模式**（`FLOORPLAN_UNATTENDED=1`，或 `--unattended`）：`floorplan/` 以外什么都不写（没有 `CLAUDE.local.md`，不写 `.git/info/exclude`，不把旧段落从 `CLAUDE.md` 里挪走），地图不点名助手，`open.mjs` 什么都不启动，构建失败或找不到地图的刷新以错误结束。
  - **结果用 JSON：** `scan.mjs`、`build.mjs`、`describe.mjs`、`refresh.mjs`、`recent.mjs` 和 `status.mjs` 上的 `--json` 打印一个 JSON 对象，而不是报告。一次刷新的 NEXT 列表带着稳定的代码（`fix_build`、`assign_new_files`、`describe`、`review_structure`、`recent_work`），程序可以照着行动。
  - **工作流做成数据：** `skills/floorplan/workflow.json` 描述 SKILL.md 走的步骤、跑哪个脚本、哪些作业需要模型、各自拿到什么、答案的结构，以及什么时候算做完，好让一个小程序跟着走。一个新测试带着它走完第一张地图和一次刷新，所以它能一直用。
  - **不点名助手的地图：** `FLOORPLAN_AGENT=none`（无人值守模式隐含这个）让地图的按钮说「让 AI 来改」，而不是点 Claude 或 Codex 的名。
- **git 读不了的仓库不再悄悄消失：** 没装 git，或因为另一个用户拥有这份检出而拒绝（"dubious ownership"，容器里很常见）时，扫描现在会点出仓库和改法，而不是一声不吭地把它留在地图外。无人值守模式下，这件事和完全找不到文件都是错误。
- 在 Claude Code 或 Codex 里用 Floorplan 的人，什么都不变。

## 0.6.3 (2026-11-02)

- **路由表里的接口**（#54，来自 @Yahhi）：没有框架的服务器经常把接口放在一份查找表里，由分发器去读，按方法和路径当键，比如 JavaScript 里的 `{ "GET /api/orders": listOrders }`，或云函数后面的一份 Python 处理函数字典。Floorplan 在这些应用里找不到接口，所以网站的请求连不上服务器。现在每个键是一个接口，以它的处理函数命名（一个函数、一个调用了函数的内联函数，或包起来的，比如 `requireAuth(createOrder)`）。用同样方式当键的别的东西，比如访问级别或备注，会放过。健康检查不判断这些接口的登录，因为分发器或处理函数在 Floorplan 看不见的地方检查。
- **Fastify 接口得到完整地址**（#30，来自 @secatech）：用 `app.register(plugin, { prefix: '/api/tickets' })` 挂上的插件，现在把它的接口放在那个前缀下，包括登记在别的插件里面的，以及用 `import()` 或 `require()` 加载的。以前每个插件的接口都坐在根上（`GET /`、`GET /:id`），所以网站的请求经常对到服务器的错误部分。
- **Django 接口得到完整地址：** 被项目包含的应用 `urls.py`（`path("api/orders/", include("orders.urls"))`）现在把它的接口放在那个前缀下，是 `/api/orders/<int:pk>` 而不是 `/<int:pk>`，所以网站的请求能连上它们。包含那一行本身不再列成接口，项目的 `urls.py` 会连到应用的。由 @rudycelekli 修复（#64）。
- **字符串里的 `/*` 之后的代码又能读了：** `'/api/*'` 这样的字符串（比如 Hono 的 `app.use('/api/*', cors())`）以前被当成注释的开头，于是从那里到下一个注释结束之间的每个接口、引用和网页请求都从地图上消失。由 @rudycelekli 修复（#61）。
- **技能安装：** 给 YAML 的说明加上引号，好让 `npx skills add` 能读。由 @Bl0ck154 修复（#25），@Mason-Little 交了同样的修复。
- **Codex 里的规划蓝图：** 构建报告现在在 Codex 里也说规划蓝图是 "planned, not built yet"（计划好了，还没做出来）。这句是报告里的固定英文。由 @owlahikit 修复。

## 0.6.2 (2026-11-02)

- **健康检查里的假警报少了很多**（谢谢 @samuelpullen15-droid，他用新的 **不是问题** 按钮从一个站点报告了 13 条）：
  - **给所有人的订阅和文件：** 读取 `rss.xml`、`atom.xml`、`llms.txt`、`ads.txt` 以及类似的，不再算敞开的接口。
  - **你自己公布的地址：** 列在你的 `llms.txt` 里，或在你的 `robots.txt` 里被允许的接口，是故意公开的。它下面有东西被列出时，一条兜底路由也算；被拦住的，或只是附近的地址，不算。
  - **标成给所有人的响应：** `Cache-Control: public` 的响应是故意公开的，包括由它引用的一个帮手设置这个头。带 `force-static` 或 `revalidate` 的 Next.js 路由也是。
  - **没什么隐私可给：** 一个 Next.js 的 `GET` 不读数据库、会话、cookie 或服务器密钥，直接不读，或通过它引用的东西也不读，就不再报告。限流器的 Redis 不算。Floorplan 跟不上的一次引用算。调用者自己选地址的那条路由上去读文件，也算。
  - **Payload CMS：** Payload 生成的 API 路由套它自己的访问规则，所以不再读成「谁都能改数据」。
  - **一句「只接受 POST」的回复：** 一个处理函数只回答 405，就不是敞开的接口，也不是发送伪造事件的办法。
  - **用共享密钥锁住的到账通知：** 和环境里的密钥比较、`timingSafeEqual`，以及 `isAuthorized()` 或 `verifyWebhookSecret()` 这类帮手，现在算 Next.js 路由上的检查。
  - **浏览器追踪器的站点令牌：** 交给追踪器 `<script>` 标签的令牌，每个访客本来就有。`ACCESS_TOKEN` 或 `AUTH_TOKEN` 这类名字，以及真的密钥格式，仍会报告。
  - **工具按名字打开的文件：** 注释说一个工具会读它，或说它是生成的，不再看起来没人用。
  - 会改数据的接口仍始终要查。健康检查算不出来的，**不是问题** 仍在。
- **健康检查漏掉的 FastAPI 检查**（#7），由 @Bl0ck154 修复：名叫 `metrics_guard` 这类的依赖、处理函数会拒绝坏的那个时 `Header` 参数里的令牌、帮手里面 Twilio 风格的签名检查，以及作为公开健康检查的 `/readyz` 和 `/livez`。
- **健康检查读每条 Express 路由自己的检查：** 定义在别处的处理函数前面的登录检查（`router.post('/books', requireAuth, createBook)`）以前会漏，于是接口被报成谁都能用。反方向，一条路由可能借走它下面那条路由的检查，名字听起来像检查的处理函数（`updateUser`）会被当成一个，于是有些敞开的接口没被报告。由 @rudycelekli 修复。

## 0.6.1 (2026-11-01)

- **健康检查里的假警报更少**（谢谢报告这些的用户）：
  - **密码的哈希不是密码：** bcrypt、argon2 以及类似的哈希不再被报成密码。`ADMIN_PASSWORD_HASH` 这类名字下面的东西也不再报，包括 `VITE_ADMIN_PASSWORD_HASH` 这类浏览器变量。用来做哈希的那个秘密（`HASH_SECRET`）仍会标出，任何名字下面真的密钥格式也仍会标出。
  - **加密的备份不是泄露的备份：** `.env` 文件里加密过的值会放过（dotenvx、sops、Ansible Vault、AWS KMS、HashiCorp Vault、age、PGP、OpenSSL 和 Fernet），有口令保护的私钥也放过。它们旁边一个没加密就留下的值仍会标出。
- **把一条标成「不是问题」：** 每条健康检查问题上的一个新按钮，可以写理由，也可以不写。这条挪到列表最底下，也不再计入个数，地图重建之后还这样。同一项检查在那个文件里发现了新东西，或问题的严重程度变了，它会再出现。**再显示** 可以撤掉。你的选择存在 `floorplan/health-dismissed.json`。导出的副本仍把这条分开搁着，但去掉你的理由。
- **愿意的话，报告一条假警报：** 同一个对话框里有一格，会替你打开一条 GitHub 议题，给你自己看、改、发送，并预览它到底会说什么。它从不包含你的代码或任何值，你不发送，什么都不会发出去。

## 0.6.0 (2026-10-31)

- **健康检查抓住 AI 做出来的应用里那些老毛病。** 五项新检查，每项都用人话，并附一段可以贴走的改法：
  - **发给浏览器的密钥：** 一把 OpenAI、Stripe 或 Supabase 的 service-role 密钥（以及其他）放在 `NEXT_PUBLIC_`、`VITE_`、`REACT_APP_` 或类似的变量里，每个访客都能读。本来就该公开的密钥，比如 Supabase 的 anon 密钥或 Stripe 的可公开密钥，会放过。
  - **谁都能读和改的 Supabase 表：** 行级安全从未打开（或被关掉）的表。按顺序重放迁移来判断，所以后来锁上或删掉的表不算。让谁都能添加、修改或删除行的策略也会标出，当作值得看一眼。
  - **让谁都能进来的 Firebase 规则：** 对谁都开着的 Firestore、Storage 和 Realtime Database 规则，包括「测试模式」的规则，以及它们什么时候失效（或已经失效）。
  - **谁都能伪造的 Stripe 到账通知：** 对 `checkout.session.completed` 这类事件采取行动、却不核对 Stripe 签名的代码，于是谁都能发一条假的「付款成功了」。
  - **让任何网站都能来调用的服务器（CORS）：** 单独是一条小注；登录用的 cookie 也一起允许时，值得修。
- **Supabase 的 `config.toml` 不再假警报：** `"env(S3_SECRET_KEY)"` 这类值是从环境读一项设置，所以不再被报成写进代码的密钥。

## 0.5.0 (2026-10-31)

- **适配手机和平板：** 顶栏折行，而不是跑出屏幕。详情在手机底部打开成一张单子（点一个框就能看）。标题下面的长说明折成一行，带展开 / 收起。每个控件至少 44 像素，好点得到。1000 像素或更宽、并且用鼠标时，什么都不变。在 #18 提出，由 @menachem-kurkus 在 #19 做的。
- **地图上的触摸手势：** 在手机或平板上拖或捏，以前会让地图跳到意想不到的地方。现在一次拖动只跟着开始的那根手指，浏览器接管这次触摸时就结束（以前拖动保持开着，跟着后来的任何移动）。第二根手指开始捏合，而不是重新开始拖动，第三根手指忽略。两根手指绕着它们之间的那一点缩放，两根一起移动就是平移。拖完之后的第一下点不再被吞掉。浏览器不再在地图下面把页面放大或弹一下，手机地址栏滑进滑出时也不再重新适配地图。鼠标、触控板和滚轮跟以前完全一样。由 @menachem-kurkus 在 #24 做的。
- **点一下之后不再冒出悬停提示：** 一次点按也会发给浏览器悬停事件，于是卡片的提示会盖在详情单上。提示现在只对鼠标显示，窄窗口里提示会留在里面。

## 0.4.4 (2026-10-31)

- **给以后的对话留的那条笔记，现在由你决定：** 在 Claude Code 里，Floorplan 不再自己往 `CLAUDE.local.md` 加它的那一段。第一张地图之后，Claude 会问这个项目以后的对话要不要用它，只有你说要才加上。你已经有的笔记会保持更新；删掉它就是去掉。
- **预先批准的命令一条一条点名：** 这个技能现在按名字列出它的八个脚本，而不是批准它的脚本文件夹里的任何东西。

## 0.4.3 (2026-10-31)

- **给 Claude 插件目录的链接：** Claude Code 的清单现在指向文档、隐私与安全那一页，以及用来求助的 GitHub 议题，所以目录列表显示的是对的链接。别的什么都没变。

## 0.4.2 (2026-10-30)

- **装上安全吗？** 新的一页列出 Floorplan 在你电脑上做的每一件事：没有挂钩、没有 MCP 服务器、没有依赖、也不会下载，它唯一对外的请求，以及它会启动的每个程序。一个测试在每次改动上盯着这些。每次发布现在带上 `CHECKSUMS.txt`，所以你可以确认装到的副本和它对得上（`node tools/checksums.mjs --check <文件夹>`）。
- **由 GitHub 的代码扫描检查：** CodeQL 现在扫描每次改动。第一次扫描找到六处要收紧的地方，都修了：三处补全转义、「由 Floorplan 做的」那条链接不再把页面文字当成 HTML 再用，以及撤销或导出失败时地图上是明白的错误消息，细节在地图服务器的输出里。

## 0.4.1 (2026-10-30)

- **导出的副本说明它们从哪来：** 导出的地图底部有一条小的「由 Floorplan · 免费开源」链接，通向这个项目，收到的人可以自己做一份。

## 0.4.0 (2026-10-30)

- **导出一份拿去分享的副本：** 地图上新的 **导出** 按钮存一个 HTML 文件，谁都能在浏览器里打开，什么都不用装。它有整张地图，没有提问栏、你的文件夹路径或 git 远程地址。流程和备注默认放进去；最近改动和健康检查（或规划蓝图的设计审查）只有你勾了才放。让 Claude 或 Codex「导出 floorplan」，或运行 `node floorplan/serve.mjs --export`。

## 0.3.2 (2026-10-30)

- **地图的服务器只应答这台电脑自己的地址：** 它拒绝任何其他主机名下的请求，所以一个把自己的域名指到 127.0.0.1 的网站（DNS 重绑定）没法加载地图、读它的令牌，再拿你的代码去提问。

## 0.3.1 (2026-10-30)

- **用当前的 Claude Code 安装时，在 Windows 上对地图提问又能用了：** 地图的服务器以前只找到 npm 安装的那个外壳垫片，然后失败在 `spawn ...\claude ENOENT`。现在它找得到包里面真正的 `claude.exe`。由 @menachem-kurkus 在 #20 和 #21 报告并修复。
- **FastAPI 上的健康检查假警报更少：** 在包含路由器的地方加上的检查，比如 `app.include_router(admin.router, dependencies=[Depends(require_admin)])`，现在保护那个路由器的每个接口，和 Express 上已经这样的 `app.use('/admin', requireStaff, adminRouter)` 一样。加在那里的数据库会话仍不算登录检查。由 @stevensiht 在 #15 修复。
- **FastAPI 路由器按它被 import 时的名字找到：** 用另一个名字 import 的路由器（`from app.routes import campaigns as campaign_routes`）得到它的前缀和它的检查。一个和路由器同名的包（`from app.platform import pricing`，旁边有一个 `platform` 路由器）不再被误认成它。由 @stevensiht 在 #15 修复。
- **分析和地图令牌不再假警报：** 健康检查不再把 Cloudflare Web Analytics 的信标令牌或 Mapbox 的公开令牌（`pk.…`）叫成泄露的密钥。两者本来就该公开：页面必须把它们发出去，分析或地图才能工作。由 @CplSyx 在 #23 报告。
- **大文件不再从地图上消失：** 最大 2 MB 的文件现在会整份读完（以前是 512 KB）。超过上限的文件仍会出现，带着行数，扫描会列出它，健康检查把它算进非常大的文件，它的卡片会说连线和密钥没查。由 @Rasherb69 在 #16 报告。

## 0.3.0 (2026-10-29)

- **规划蓝图：做出来之前先规划。** Floorplan 仍给已有的代码画地图；现在也可以从完全没有代码开始。把一份 PRD、规格或一段你想做的东西的描述给它，Floorplan 画出要做成它需要什么：每一块、每个文件、每个接口和每个页面，它们怎么连，以及它们靠哪些外面的服务。它标成计划（虚线卡片和 **规划蓝图** 标签）。健康检查变成对计划的设计审查（谁都能用的接口、PRD 没定的决定、没收干净的线头），每一块有 **让 Claude 来做**（或 Codex），一段按计划做它的现成请求。把提问栏拨到 **改规划**，就能从地图上改计划（「把退款也规划进去」）：地图重画，新的和改过的部分标出来，**撤销** 放回去。设计审查的条目可以用 **在地图上处理** 同样定下来：一个还没回答的问题，你只要给出答案。代码写出来之后，地图可以换成真实代码。
- **带方括号的文件夹名**，比如 Next.js 的 `[id]` 和 `[...slug]`，可以照原样写进 `architecture.json` 的路径模式；它们精确匹配那个文件夹。

## 0.2.2 (2026-10-28)

- **浅色模式：** 顶栏一个新的 **外观** 按钮，按下去在 **自动 → 浅色 → 深色** 之间转。自动跟着这台设备的浅色或深色设置，并一起变。你的选择记在这台设备上，地图从第一眼就是对的颜色，不会闪一下。按钮是 44 像素的目标，键盘能用，焦点环看得见，切换是立刻的（什么都不动画，所以「减少动态」会得到尊重）。深色看起来和以前完全一样。在 #9 提出，由 @menachem-kurkus 在 #10 做的。

## 0.2.1 (2026-10-28)

- **Firebase Cloud Functions：** 可调用函数（`onCall`）和 `onRequest` 函数现在显示成接口，名字按你的函数入口文件导出它们的方式，网站的 `httpsCallable` 调用和请求会到达它们，包括通过你自己包了一层 `httpsCallable` 的帮手。所以一个 React + Firebase 应用的网站和服务器在地图上连起来了，页面显示每一页背后的服务器代码，提问也能跟着这些线走。可调用函数显示成 `CALL /名字`。由 @omardlr-aviv 在 #8 报告。
- **Firebase 上的健康检查：** 没有登录检查的可调用函数和 `onRequest` 函数（`request.auth`、`context.auth`、App Check 或验证过的 ID 令牌）会像任何别的谁都能调用的接口一样被标出。
- **后台函数：** 定时函数，以及 Firestore、Storage、Pub/Sub 和 Auth 的触发器，列给 AI，由它放到地图的后台部分。

## 0.2.0 (2026-10-28)

- **能在 Codex 里用：** Floorplan 现在也是一个 Codex 插件，同一个技能、同一张地图、同一套健康检查，用你的 ChatGPT 登录，不用 API 密钥。当时从 Codex 应用安装、不用终端的办法是：**Plugins → Add a marketplace →** `haydenschmitty/floorplan`，然后安装 Floorplan。那是上游英文版的安装位置，留在这里作为当时的记录。这份中文版请装 `Aondle/floorplan`，见[在 Codex 里用 Floorplan](docs/codex.md)。
- **通过 Codex 提问：** 用 Codex 做的地图里，提问栏在你的电脑上跑你自己的 Codex，在它的只读沙箱里，这些运行不进你的 Codex 历史。追问会把对话留着。地图的服务器用做这张地图的那个助手，只有另一个装了时就退到另一个（`--engine claude|codex` 指定一个）。
- **说出它在跟谁一起干活：** 提问栏、健康检查面板的「让 Claude 来改」或「让 Codex 来改」，以及请一条流程，都会点出做这张地图的助手。在 Codex 里，Floorplan 不动你项目的笔记（没有和私人的 `CLAUDE.local.md` 对应的东西）。
- **文档** 通篇覆盖两个应用，并有了新的[在 Codex 里用 Floorplan](docs/codex.md) 指南。

## 0.1.5 (2026-10-28)

- **FastAPI 上的健康检查假警报更少：** 自己的名字就说它在检查调用者的依赖捷径，比如 `AdminAccess = Annotated[dict, Depends(check)]`，现在就算登录检查，哪怕它的函数名字很普通。
- **FastAPI 上的健康检查更准：** 更多数据库会话帮手被认出来（`get_sql_session`、`SessionLocal`、引擎、连接和工作单元帮手），所以一个接口只有其中之一时会被标出，而不是当成有保护就放过。两者都由 @PaulMagos 在 #6。
- **地图服务器收紧：** 地图的本地服务器不再从名字以 "floorplan" 开头的相邻文件夹提供文件（比如 `floorplan-old/`）。一个畸形的网址现在得到一条错误，而不是把服务器停掉。两处都是新测试找到的。
- **测试：** 一套测试现在覆盖代码怎么读、健康检查、一个两个仓库的样例应用的整张地图、隐私承诺（离线地图、任何地方都不写下密钥的值）以及地图服务器的安全检查。它在每次推送和每个拉取请求上跑，Linux 和 Windows，macOS 每周一次。用 `npm test` 跑。

## 0.1.4 (2026-10-28)

- **Safari 修复：** 卡片现在在 Safari 里显示（iPhone / iPad 上的每个浏览器也是）。以前只画出连线，卡片文字出现在左上角。由 @fpv001 在 #1 报告，由 @PaulMagos 在 #3 修复。
- **FastAPI 上的健康检查假警报更少：** 通过共享的依赖捷径保护的接口，比如 `user: AdminUser`，而 `AdminUser = Annotated[..., Depends(...)]`，不再被报成谁都能用。包括在另一个文件里定义的捷径，以及建在别的捷径上的捷径。数据库会话依赖（`SessionDep`、`get_db`）不再算登录检查，所以只有它的接口会按该有的方式被标出。由 @PaulMagos 在 #4 报告。

## 0.1.3 (2026-10-28)

- **离线能用，没有对外请求：** 地图的排版引擎（elkjs）和字体现在打包进它，不再从 jsDelivr 和 Google Fonts 加载。地图在下一次更新时得到这个。
- 候补名单服务的代码不再是插件下载的一部分。它仍可以在仓库的历史里读，从[隐私与安全](docs/privacy-and-security.md#floorplan-cloud-waitlist)链过去。

## 0.1.2 (2026-10-27)

- **Floorplan Cloud 候补名单：** 地图打开两分钟后，角落一张卡片会问一次：Floorplan Cloud（共享的、跟着同步的团队地图）上线时，你想不想收到邮件。你不点 **有消息通知我**，什么都不会发出去；点了也只发你的邮箱，以及「就我自己」还是「和团队一起」。**用我的 Claude 邮箱** 填上你的 Claude 账号地址，发出去之前你看得到。**别再问了**，或 `FLOORPLAN_NO_PROMPTS=1`，把它关掉。见[隐私与安全](docs/privacy-and-security.md#floorplan-cloud-waitlist)。
- 候补名单服务的代码在 `services/waitlist/`：按 IP 地址和总体上限流，只写不读，并且有上限。

## 0.1.1 (2026-10-27)

- **找到更多连线：** 通过从一个 API 客户端 import 来的小帮手发出的请求，比如 Python 任务里的 `post("/orders", …)`，现在会对上它们到达的接口。
- **健康检查的假警报更少：**
  - 在挂载的地方被保护的 Express 路由器（`app.use('/admin', requireStaff, adminRouter)`），包括嵌在它们里面的路由器，不再被报成谁都能用。
  - 新闻邮件、联系和候补名单的注册，按故意公开来对待。
- **流程：** 一条流程在播放时，页面标题淡出，所以流程条不再盖住它。
- **页面：** 一个页面的板子标成「页面」，不再标成「回答」。
- **README：** 截图，来自一个从头到尾画过的演示应用。

## 0.1.0 (2026-10-27)

第一次发布。

- **地图：** 一个代码库的可交互节点图，从整个应用一直到单个文件和接口。每一块都有人话名字和说明。并排放着的好几个仓库也能用。
- **连线：** 引用，以及网页请求对上它们到达的服务器接口，包括在变量里拼出来的 URL、嵌套的模板字符串和小的请求帮手。Flask 蓝图和 Express 路由器的前缀会补全，嵌套的挂载也包括。
- **页面：** 认出应用的页面（Next.js、React Router、Vue、SvelteKit、Remix、Nuxt、Astro、Expo、Angular、TanStack），并显示每一页背后的一切。
- **健康检查：** 代码里的密码和密钥、不登录谁都能用的接口、没人用的文件和非常大的文件，每一项都有一段现成的修复请求。密钥的值从不保存。
- **提问：** 问题回答成一张小地图加一段讲解，通过 Claude Code 命令行或 Claude 应用。
- **流程：** 引导讲解，加上「请一条新流程」。
- **新手导览**、人话术语表，以及一个「显示技术细节」开关。
- **最近改动：** Claude 刚改过的卡片会标出来，每一张都有一句把改动和当时的要求连起来的说明。
- **更新：** 刷新只重读有变化的部分，已经打开的地图会自己刷新。
- **Git：** Floorplan 创建的东西都不会提交。地图文件夹自己忽略自己，Claude 的笔记进 `CLAUDE.local.md`。
