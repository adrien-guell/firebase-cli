# firebase-cli

A CLI to make advenced operations on firebase. Use `firebase-cli help` to see documentation. 

## Installation

```shell
npm i firebase-utils-cli
```

#Commands

## Features
With this cli, you can :
- **copy collections** from a firebase project to another
- **delete collections** from a firebase project
- **import collections** to a firebase project from a local JSON file
- **export collections** to a local JSON file from a firebase project
- **import a remote config** to a firebase project from a local JSON file
- **export a remote config** to a local JSON file from a firebase project

>You can set a default service account path that will be used if you do not specify one.

>You can also blocklist projects with their id to avoid unwanted modifications on a project.

## Import / Export collections

The JSON file must follow the following template :
```json
{
    "collection1": {
        "document1": {
            "data1": "value",
            ...
        },
        "document2": {
            "data1": "value",
            ...
        }
    },
    "collection2": {
        "document1": {
            "data1": "value",
            ...
        }
    }
}
```

# Implementing more features

## Adding a command

To add a command, create a new ts file in commands folder.\
Create a Command object using the following type definition:
```typescript
export const myCommand: Command = {
    name: 'my-command-name',
    description: 'what my command does',
    arguments: [
        {
            name: 'myRequiredArgumentName',
            info: 'what my required argument is used for',
        },
        {
            optional: true,
            name: 'myOptionnalArgumentName',
            info: 'what my optionnal argument is used for',
            list: true, // true if arguments are a list
        },
    ],
    options: [
        {
            name: 'my-first-option-name', // will be camel cased when given in options
            info: 'what my option is used for',
        },
        {
            name: 'my-second-option-name',
            short: 'o', //short flag for the option
            argName: 'mySecondOptionArgumentName', // implies that the option needs an argument
            info: 'what my option is used for',
        },
        { 
            name: 'my-third-option-name',
            info: 'what my option is used for',
            argName: 'myThirdOptionArgumentName',
            list: true, // true if the param is a list
        },
    ],
    action: myActionFunction,
}
```

Then create an option type like so :
```typescript
type myCommandOptions = {
    myFirstOptionArgumentName: boolean;
    mySecondOptionArgumentName?: string;
    myThirdOptionArgumentName?: string[];
};
```

Then define your action function using the following template :
```typescript
async function myActionFunction(
    myRequiredArgumentName: string,
    myOptionnalArgumentName?: string[],
    options?: myCommandOptions
);
```

Finally, add the command to the list of commands in the index.ts file :
```typescript
const commands = [myCommand, command1, command2];
```

> Feel free to look up the already implemented commands to get more examples.

## Deploying

To deploy the application on npm, run the following commands. 
> Currently, only the original author can do so
```shell
tsc
npm publish
```
