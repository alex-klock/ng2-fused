import * as path from 'path';

export interface NgBuildConfigOptions {
    /**
     * Whether or not to build the app using Ahead Of Time compilation for Angular. If false, standard JIT build is used.
     */
    aot?: boolean;

    /**
     * Build paths for folders and/or files used in the build process.
     */
    buildPaths?: {
        /**
         * The base temp folder where build steps and files will be output to.  This is relative to the project's root directory.  Defaults to 'build'.
         */
        build?: string;
        /**
         * The folder were the built application will be output to, relative to the project's root directory. Defaults to 'dist'.
         */
        dist?: string;
        /**
         * The folder in which pre-fusebox steps are taken, relative to the paths.build folder.  Defaults to 'fusing'.
         */
        workspace?: string;
    };

    css?: {
        minify?: boolean;
        sourcemaps?: boolean;
    };

    js?: {
        minify?: boolean;
        sourcemaps?: boolean;
        treeShake?: boolean;
    };

    noCache?: boolean;

    optimize?: boolean;

    /**
     * Whether or not this is a production build. Overrides some other settings if true. Sets Angular in production mode.
     */
    production?: boolean;

    server?: {
        enabled?: boolean;
        open?: boolean;
        port?: number;
        root?: string;
    };

    watch?: boolean;
}

export interface NgBuildConfigUtils {
    /**
     * Informational context about the build being executed.
     */
    buildContext: {
        tasks: {
            file: string;
            isAsync: boolean;
            name: string;
        }[];
    };

    /**
     * Getters for build paths that easily allow the joining of paths. All paths are returned with foward slashes, despite what's in buildPaths.
     */
    paths: {
        build(): string;
        build(joinPath:string): string;
        build(prefix: string, joinPath: string): string;
    
        dist(): string;
        dist(joinPath: string): string;
        dist(prefix: string, joinPath: string);
        
        workspace(): string;
        workspace(joinPath: string): string;
        workspace(prefix: string, joinPath: string);
    };
}

const defaultConfig: NgBuildConfigOptions =  {
    aot: false,
    buildPaths: {
        build: 'build',
        dist: 'dist',
        workspace: 'workspace'
    },
    css: {
        minify: false,
        sourcemaps: true
    },
    js: {
        minify: false,
        sourcemaps: true,
        treeShake: false,
    },
    noCache: false,
    optimize: false,
    production: false,
    server: {
        enabled: false,
        open: true,
        port: 8080,
        root:  path.join(process.cwd(), 'dist')
    },
    watch: false
}

export const NgBuildConfig: NgBuildConfigOptions & NgBuildConfigUtils = Object.assign({}, defaultConfig, {
    buildContext: {
        tasks: []
    },
    paths: {
        build: function (joinPathOrPrefix?: string, joinPath?: string) {
            return getBuildPath(NgBuildConfig.buildPaths.build, joinPathOrPrefix, joinPath);
        },
        dist: function (joinPathOrPrefix?: string, joinPath?: string) {
            return getBuildPath(NgBuildConfig.buildPaths.dist, joinPathOrPrefix, joinPath);
        },
        workspace: function (joinPathOrPrefix?: string, joinPath?: string) {
            return getBuildPath(
                path.posix.join(NgBuildConfig.buildPaths.build, NgBuildConfig.buildPaths.workspace),
                joinPathOrPrefix,
                joinPath
            );
        }
    }
});

/**
 * Gets whether or not a command line argument exists.
 * 
 * @export
 * @param {string} argName The argument name (without any dashes).
 * @param {string} [aliasCharacter] A shorthand character alias that can be used with in the command line via a single dash and that character.
 * @returns 
 */
export function hasCommandLineArg(argName: string, aliasCharacter?: string) {
    return process.argv.indexOf('--' + argName) !== -1;
}

function getBuildPath(configPath: string, prefix: string, joinPath: string) {
    if (prefix && !joinPath) {
        joinPath = prefix;
        prefix = null;
    }
    return path.posix.join(prefix || '', configPath, joinPath || '').replace(/\\/g, '');
}

NgBuildConfig.aot = hasCommandLineArg('aot');
NgBuildConfig.noCache = hasCommandLineArg('nocache');
NgBuildConfig.js.treeShake = hasCommandLineArg('treeshake');
NgBuildConfig.server.open = !hasCommandLineArg('noopen');

if (hasCommandLineArg('minify')) {
    NgBuildConfig.css.minify = true;
    NgBuildConfig.js.minify = true;
}

if (hasCommandLineArg('optimize') || hasCommandLineArg('prod')) {
    NgBuildConfig.css.minify = true;
    NgBuildConfig.js.minify = true;
    NgBuildConfig.js.treeShake = true;
    NgBuildConfig.optimize = true;
}

if (hasCommandLineArg('prod')) {
    NgBuildConfig.noCache = true;
    NgBuildConfig.production = true;
}

if (hasCommandLineArg('serve')) {
    NgBuildConfig.server.enabled = true;
}