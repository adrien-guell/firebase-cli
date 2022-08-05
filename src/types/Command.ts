import { Option } from './Option';
import { Argument } from './Argument';

export type Command = {
    name: string;
    arguments: Argument[];
    options: Option[];
    description: string;
    action: (...args: any[]) => void | Promise<void>;
};
