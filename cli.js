#!/usr/bin/env node

const util = require('util');
const {
  spawn,
  execSync,
} = require('child_process');
const exec = util.promisify(require('child_process').exec);

const captureExit = require('capture-exit');
const glob = require('glob');
const execa = require('execa');
const inflection = require('inflection');
const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const {
  addLine,
  modLine,
} = require('add-line');
const {
  cd,
  echo,
  which,
  rm,
  exit,
  sed,
  pwd,
  test,
} = require('shelljs');

const codeBluePrints = require('./constants/bluePrints.js');
const {
  dataEntryBuild,
} = require('./constants/build-steps.js');
const {
  TYPES,
  typesObject,
  validTypes,
  singlularTypes,
} = require('./constants/file-types.js');
const {
  createAppQuestions,
} = require('./constants/questions.js');

const translateStatementPromise = util.promisify(translateStatement);
const execComplexBuildPromise = util.promisify(execComplexBuild);
let buildIndex = 0,
    routeTypeCount = 0,
    fullHost;

/***** Main Execution *****/
/**************************/
runProgram();

function runProgram() {
  program
    .version('0.1.0')
    .command('ember-build <statement>')
    .alias('e')
    .description('Build an ember app through statements')
    .action((statement) => {
      /* Check for Ember */
      /*******************/
      if (!which('ember')) {
        echo(chalk.red('ember-cli is not installed'));
        exit(1);
      }
      /* Check for Ember app */
      /***********************/
      if (!test('-f', 'ember-cli-build.js')) {
        echo(chalk.red('No ember app found'));

        inquirer.prompt(createAppQuestions).then(async answers => {
          appName = answers.appName;
          if (appName) {
            await exec(`ember new ${appName} --yarn`, function(error, stdout, stderr) {
              if (error) {
                console.error(chalk.red(`Ember create error: ${error}`));
                exit(1);
              }
              console.log(`stdout: ${stdout}`);
              console.log('Successfully executed');

              process.chdir(appName);
              translateStatementPromise(statement);
            });
          } else {
            echo(chalk.green('No actions to complete!'));
            exit(1);
          };
        }).catch((e) => {
          console.error(chalk.red(e));
          exit(1);
        });
      } else {
        try {
          translateStatementPromise(statement);
        } catch(err) {
          echo(chalk.red(error));
          exit(1);
        }
      }
    });

  program.parse(process.argv);
};

async function translateStatement(statement) {
  let regex, buildType, modifiedName;

  if (statement.includes('http') && statement.includes('data')) {
    regex = /(?:I need to|) get data from (\S+) for (\w+)/i;
    buildType = 'complex';
  } else {
    regex = /(?:I \w+ a |)(\w+) for (\w+)/i;
    buildType = 'simple';
  }

  const [
    /* ignore full match */,
    type,
    name,
  ] = statement.match(regex);
  let normalizedName = inflection.singularize(name);

  if (type.includes('http')) {
    const [
      /* ignore full match */,
      urlScheme,
      urlHostPath,
    ] = type.match(/(https?:\/\/)(\S+)/i);
    const urlHostPathArray = urlHostPath.split('/');
    const baseHost = urlHostPathArray.shift();

    fullHost = urlScheme + baseHost;
    namespace = urlHostPathArray.join('/');

    await execComplexBuildPromise(normalizedName, buildIndex);

    return 'success';
  } else {
    if (!validTypes.includes(type)) {
      // console.log(chalk.red(`Error: "${type}" is not a valid file type in ember`));
      throw `Error: "${type}" is not a valid file type in ember`;
    } else {

      if (singlularTypes.includes(type)) {
        modifiedName = inflection.singularize(name);
      }

      exec(`ember g ${type} ${modifiedName || name}`, function(error, stdout, stderr) {
        if (error) {
          console.error(chalk.red(`Ember create error: ${error}`));
          exit(1);
        }
        console.log(`stdout: ${stdout}`);
        console.log('Successfully executed');
      });

      return 'success';

    }
  }
}

async function execComplexBuild(name, index) {
  const {
    path: hostPath,
    preceding: hostTarget,
    bluePrint: hostBluePrint,
  } = codeBluePrints.host;
  const {
    path: namespacePath,
    preceding: namespacePreceding,
    bluePrint: namespaceBluePrint,
  } = codeBluePrints.namespace;
  const {
    path: corsPath,
    preceding: corsPreceding,
    bluePrint: corsBluePrint,
  } = codeBluePrints.cors;
  const adapterInputLine = `${hostBluePrint(fullHost)}\n${namespaceBluePrint(namespace)}`;

  try {
    // for (const entryType of dataEntryBuild) {
      const entryType = dataEntryBuild[index];
      const isRouteType = entryType === 'route';
      let pluralName;

      if (isRouteType) {
        ++routeTypeCount;
        pluralName = inflection.pluralize(name);
      };

      if (index === dataEntryBuild.length) {
        await addLine(hostPath(name), hostTarget, adapterInputLine);
        const addLineExecution = await addLine(corsPath, corsPreceding, corsBluePrint(fullHost));

        if (addLineExecution.state === 'modified') {
          console.log(addLineExecution.modifiedLine)
          modLine(corsPath, `'self' http`, '",', ` ${fullHost}`);
        }

      } else if (isRouteType && routeTypeCount === 2) {

        await exec(`ember g route ${pluralName}/${name}`, function(error, stdout, stderr) {
          if (error) {
            console.error(chalk.red(`Ember route generator error: ${error}`));
            exit(1);
          }
          console.log(`stdout: ${stdout}`);
          console.log('Successfully executed');
          ++buildIndex;
          execComplexBuildPromise(name, buildIndex);
        });

      } else {

        await exec(`ember g ${entryType} ${pluralName || name}`, function(error, stdout, stderr) {
          if (error) {
            console.error(chalk.red(`Ember generator error: ${error}`));
            exit(1);
          }
          console.log(`stdout: ${stdout}`);
          console.log('Successfully executed');
          ++buildIndex;
          execComplexBuildPromise(name, buildIndex);
        });

      }
    // };

    return 'success';
  } catch (e) {
    console.log(chalk.red(`execComplexBuild error: ${e}`));
    exit(1);
  }
}

// Regex: /(?:\w+) (\w+) for (\w+)/i
// I need a controller for addresses
/* intent (hash): I need a */
/* operative: controller, for addresses */
/* type (required): controller */
/* targetName (required): addresses */

/* ember g controller addresses */
/* ember g type targetName */

// I need an adapter for addresses
/* ember g adapter addresses */

// I need to get data from https://some-site.com/api for puppies
/*
 * /(?:I need to|) get data from (\w+) for (\w+)/i
 * ember g adapter puppy
 * ember g serializer puppy
 * ember g model puppy
 * ember g route puppies
 * ember g route puppies/puppy
 * update config/environment.js file
 */

// Regex /(?:I \w+ a |)(\w+) for (\w+)$/i
/*
 * ie: I need a model for address
 * group #1 type
 * group #2 name
 *
 * ember g model address
 * ember g <type> <name>
 *
 */

// Regex /(?:\w+ support|) \w+ (\w+) \w+ (\w+)/i
/*
 * ie: I need to support an endpoint for users
 * ie: Add support for endpoint named users
 * group #1 type
 * group #2 name
 *
 * ember g adapter user
 * ember g serializer user
 * ember g model user
 * ember g route users
 * ember g route users/user
 *
 */

 // Regex /(?:I \w+|)/i
 /*
  * ie: I need to implement d3
  *
  *
  *
  */
