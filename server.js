import express from 'express';
import { join, parse } from 'path';
import { promises } from 'fs';
import { config } from './config.js';
import chalk from 'chalk';
import { langs } from './langs.js';
import { exec } from 'child_process';

const app = express();

app.use(express.static('/public'));
app.use(express.static(config.path.emails));

/**
 * JSON response schema:
 * {
 *     "pages": ['account-restored', 'did-you-know-1',...] array of compiled email file names,
 *     "langs": { ru: Russian, bn: Bengali,...} map of lang codes,
 *     "project": "PRIME" or "TURBO"
 * }
 */
app.get('/emails', async (req, res) => {
    promises
        /** scan compiled emails directory */
        .readdir(join(config.path.emails, 'en'))
        /** removes subject files */
        .then((pages) => pages.filter((file) => !parse(file).name.includes('subject')))
        /** removes files extension */
        .then((pages) => pages.map((file) => parse(file).name))
        /** structure data to json */
        .then((pages) =>
            res.json({
                pages,
                langs,
                project: pages.some((page) => page.includes('cov') || page.includes('did-you-know'))
                    ? 'PRIME'
                    : 'TURBO',
            })
        )
        .catch(() => {
            console.log(chalk.bgRedBright.whiteBright(` ERROR `) + ' ' + config.cli.messages.error);
            res.sendStatus(500);
        });
});

// app.get('/execute/:command', (req, res) => {
//     exec(req.params.command, { cwd: config.path.emailsProject }, (error, stdout, stderr) => {
//         if (stderr || error) {
//             let errorText;
//             stdout && (errorText += stdout);
//             error && (errorText += error);
//
//             console.log('[ERROR]: exectuting command via /execute/command ❌ ');
//             console.log('[COMMAND]: ' + req.params.command);
//             console.log('[ERROR DETAILS]:');
//             console.group();
//             console.group();
//             console.log(errorText);
//             console.groupEnd();
//             console.groupEnd();
//
//             res.status(500).send(errorText);
//         } else {
//             console.log('[LOG]: Executing command success ' + req.params.command);
//             res.status(200).send(stdout);
//         }
//     });
// });

app.listen(config.server.port, () => {
    console.log(`[PORT:${config.server.port}]: Emails server started... http://localhost:${config.server.port} ✅`);
});
