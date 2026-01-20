declare function Application(name: string): Application;
declare function Application(name: "currentApplication"): CurrentApplication;

interface Application {
  includeStandardAdditions: boolean;
}

interface CurrentApplication extends Application {
  doShellScript(script: string): string;
}

declare namespace Application {
  function currentApplication(): CurrentApplication;
}
