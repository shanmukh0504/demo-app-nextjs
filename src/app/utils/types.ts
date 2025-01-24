export type InputFieldProps = {
    id: string;
    label: string;
    value: string | null;
    readOnly?: boolean;
    error?: string | null;
    onChange?: (value: string) => void;
    placeholder?: string;
};

export type QuoteResponse = {
    error?: string;
    ok: boolean;
    val?: {
        input_token_price: number;
        output_token_price: number;
        quotes: {
            [strategy: string]: string;
        };
    };
};
