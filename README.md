# ts-irc

IRC implementation in TypeScript

## Getting Started

To install, build and run this, you'll need [Node.js](https://nodejs.org) and [Node Package Manager](https://www.npmjs.com/) installed, up-to-date and you'll need them in your PATH environment variable.

### Setup

bash```

$ git clone https://github.com/IZEDx/ts-irc.git
$ cd ts-irc/
$ npm install

```

This should now download the sourcefiles, install the dependencies and build the project.

Sometimes the building of the project right after "npm install" may fail, in this case please build manually:

bash```

$ npm run build

```

Once built, you can run this project from the project root by using

bash```

$ npm run start -- "port"

```

*Where "port" insert the port, which the server should listen on.*

### Available NPM Scripts

Here is a list of available npm scripts that should work right out of the box and are worth to know:

Installs all dependencies:

bash```

$ npm install

```

Builds the whole project:

bash```

$ npm run build

```

Starts the project:

bash```

$ npm start

```

Starts a watcher to compile, once a file changes:

bash```

$ npm run watch

```

Runs TSLint to statically analyze the code:

bash```

$ npm run lint-check

```

Runs TSLint to statically analyze the code and fix the issues immediately:

bash```

$ npm run lint-fix

```
