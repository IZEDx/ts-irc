#! /usr/bin/env node

const IRC   = require("./dist/main.js");
const yargs = require("yargs");

yargs.alias   ("p", "port");
yargs.default ("p", 6667);
yargs.describe("p", "Port to listen on.");

IRC.main(yargs.parse(process.argv));