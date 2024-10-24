
export interface UndoableCommand {
    execute(): void;  // do & redo
    undo(): boolean;
}





export class CommandSystem extends Array<UndoableCommand> {
    public initializers: Array<() => void>;
    public undo_cache: Array<UndoableCommand>;

    constructor() {
        super();
        this.initializers = [];

        this.initialize();
    }

    initialize(): void {  // return to an 'empty' state
        for (const fx of this.initializers) { fx(); }
        this.length = 0;
        this.undo_cache = [];
    }

    undo(times?: number): void {
        if (times === undefined) {
            if (this.length == 0) { return; }

            let last_cmd = this.pop()!;
            this.undo_cache.push(last_cmd);
            let succ = last_cmd.undo();

            if (!succ) {  // this command is not undoable
                for (const fx of this.initializers) { fx(); }
                for (const cmd of this) {
                    cmd.execute();
                }
            }

        } else {
            for (let i = 0; i < times; i++) {
                this.undo(); // recursively call undo specified number of times
            }
        }
    }

    // method to redo actions, with optional 'times' argument for multiple redos
    redo(times?: number): void {
        if (times === undefined) {
            // exit if no further actions to redo
            if (this.undo_cache.length === 0) { return; }

            let redo_cmd = this.undo_cache.pop()!;
            redo_cmd.execute();
            this.push(redo_cmd);

        } else {
            for (let i = 0; i < times; i++) {
                this.redo(); // recursively call redo specified number of times
            }
        }
    }

    push(...items: UndoableCommand[]): number {
        this.undo_cache = []

        // perform newly added commands
        for (const cmd of items) {
            cmd.execute();
        }

        return super.push(...items);
    }
}
