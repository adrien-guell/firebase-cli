# firebase-cli

## Adding a command

To add a command, create a new ts file in commands folder.
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
        },
    ],
    options: [
        {
            name: 'myFirstOptionName',
            info: 'what my option is used for',
        },
        {
            name: 'mySecondOptionName',
            short: 'o', //short flag for the option
            paramName: 'mySecondOptionParameterName', // --mySecondOptionName [mySecondOptionParameterName]
            info: 'what my option is used for',
        },
        { 
            name: 'myThirdOptionName',
            info: 'what my option is used for',
            paramName: 'myThirdOptionParameterName', // --myThirdOptionName [myThirdOptionParameterName]
            list: true, // true if the param is a list
        },
    ],
    action: myActionFunction,
}
```

Then create an option type like so :
```typescript
type myCommandOptions = {
    mySecondOptionName: string;
    myThirdOptionName: string[];
};
```

Then define your action function using the following template :
```typescript
async function myActionFunction(
    myRequiredArgumentName: string,
    myOptionnalArgumentName?: string,
    options: myCommandOptions
);
```

Finally, add the command to the list of commands in the firebaseCli.ts file :
```typescript
const commands = [myCommand, command1, command2];
```