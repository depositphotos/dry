#!/usr/bin/env node

const { execSync } = require('child_process')
const { readFileSync } = require('fs')
const pino = require('pino')


const log = pino({
   level:'debug',
   base: {},
   prettyPrint: {
      colorize: true,
      translateTime: true
   }
})

const projectName = exec('git config --get remote.origin.url').
   match('([^/]+)\\.git\n')[1]

log.info('Project name: ' + projectName)

exec(`rm -rf ./test_reports/`)

const prodImageId = exec(
   `docker build -t ${projectName} --target prod -f - .`,
   { input: readFileSync(__dirname + '/templates/Dockerfile.node') }
   )
   .match(/^Successfully built ([a-z0-9]+)$/m)[1]

log.info(`Production image id: ${prodImageId}`)


const testImageId = exec(
   `docker build -t ${projectName}-test --target test -f - .`,
   { input: readFileSync(__dirname + '/templates/Dockerfile.node') }
   )
   .match(/^Successfully built ([a-z0-9]+)$/m)[1]

log.info(`Test image id: ${testImageId}`)

exec(`docker run ${testImageId}`)
exec(`docker cp $(docker ps -lq):/app/test_reports ./`)
exec(`docker rm -f $(docker ps -lq)`)
exec(`docker rmi ${testImageId}`)


function exec(command, options = {}) {
   options.encoding = 'utf-8'
   log.debug(`Run ${command}`)
   const r = execSync(command, options)
   log.debug(r)
   return r
}