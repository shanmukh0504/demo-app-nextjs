export type InputFieldProps = {
    id: string;
    label: string;
    value: string | null;
    readOnly?: boolean;
    error?: string | null;
    onChange?: (value: string) => void;
    placeholder?: string;
};
