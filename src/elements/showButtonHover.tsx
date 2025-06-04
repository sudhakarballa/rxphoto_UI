import { useState } from "react";

export const ShowButtonHover = () => {
    const [style, setStyle] = useState({ display: 'none' });

    return (
        <div >
            <div style={{width: 10, height: 10, padding: 100, paddingTop:10}}
                onMouseEnter={e => {
                    setStyle({ display: 'block' });
                }}
                onMouseLeave={e => {
                    setStyle({ display: 'none' })
                }}
            >
                <button style={style}>+</button>
            </div>
        </div>
    );
}