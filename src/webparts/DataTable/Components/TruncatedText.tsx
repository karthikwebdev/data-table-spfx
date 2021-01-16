import React, { useState } from "react";

interface Props{
  text:string
}

function TruncatedText({ text }:Props) {

  const [isTextOpen, setIsTextOpen] = useState<boolean>(false);

  return <span>
    {
      isTextOpen ? text : text.slice(0,40)  
    }
    <span
      style={{
        padding:"20px 0",
        color:"blue",
        textDecoration:"underlined",
        cursor:"pointer"
      }}
      onClick={() => setIsTextOpen(prev => !prev)}
>
      ...Read { isTextOpen ? "Less" :"More"}
    </span>
  </span>;
}

export default TruncatedText;
