import React, { useState } from "react";
import Tooltip, { TooltipProps } from '@material-ui/core/Tooltip';
import { makeStyles, Theme } from "@material-ui/core";

interface Props{
  text:string
}

const useStylesBootstrap = makeStyles((theme: Theme) => ({
  arrow: {
    margin:0
  },
  tooltip: {
    margin:0,
    fontSize: 15
  },
}));

function BootstrapTooltip(props: TooltipProps) {
  const classes = useStylesBootstrap();
  return <Tooltip arrow classes={classes} {...props} />;
}

function TruncatedText({ text }:Props) {
  const [isTextOpen, setIsTextOpen] = useState<boolean>(false);
  return(
    <BootstrapTooltip title={text} >
      <span>
        {
          isTextOpen ? text : text.slice(0, 40)
        }
        <span
          style={{
            padding: "20px 0",
            color: "blue",
            textDecoration: "underlined",
            cursor: "pointer"
          }}
          onClick={() => setIsTextOpen(prev => !prev)}
        >
          {" "} ... {" "}Read {isTextOpen ? "Less" : "More"}
        </span>
      </span>
    </BootstrapTooltip>
  )
}

export default TruncatedText;
