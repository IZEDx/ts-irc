# ts-irc

IRC implementation in TypeScript

## Getting Started

To install, build and run this, you'll need [Node.js](https://nodejs.org) and [Node Package Manager](https://www.npmjs.com/) installed, up-to-date and you'll need them in your PATH environment variable.

### Setup Source

```
$ git clone https://github.com/IZEDx/ts-irc.git
$ cd ts-irc/
ts-irc$ npm install
```

This should now download the sourcefiles, install the dependencies and build the project.

Sometimes the building of the project right after "npm install" may fail, in this case please build manually:

```
ts-irc$ npm run build
```

Once built, you can globally link this project to run it from anywhere.

```
ts-irc$ npm link
```

From now on every compiled change will be runnable using

```
$ ts-irc "port"
```

*Where "port" insert the port, which the server should listen on.*

### Available NPM Scripts

Here is a list of available npm scripts that should work right out of the box and are worth to know:

Installs all dependencies:

```
ts-irc$ npm install
```

Builds the whole project:

```
ts-irc$ npm run build
```

Starts the project:

```
ts-irc$ npm start
```

Starts a watcher to compile, once a file changes:

```
ts-irc$ npm run watch
```

Runs TSLint to statically analyze the code:

```
ts-irc$ npm run lint
```

Runs TSLint to statically analyze the code and fix the issues immediately:

```
ts-irc$ npm run lint-fix
```
