import React, { useState } from "react";
import Tooltip, { TooltipProps } from '@material-ui/core/Tooltip';
import { makeStyles, Theme } from "@material-ui/core";

interface Props{
  text:string
}

const useStylesBootstrap = makeStyles((theme: Theme) => ({
  arrow: {
    color: theme.palette.common.black,
    margin:0
  },
  tooltip: {
    backgroundColor: theme.palette.common.black,
    margin:0
  },
}));

function BootstrapTooltip(props: TooltipProps) {
  const classes = useStylesBootstrap();

  return <Tooltip arrow classes={classes} {...props} />;
}

function TruncatedText({ text }:Props) {

  const [isTextOpen, setIsTextOpen] = useState<boolean>(false);

  return <span>
    {
      isTextOpen ? text : text.slice(0,40)  
    }
    <BootstrapTooltip title={text} >
      <span
        style={{
          padding: "20px 0",
          color: "blue",
          textDecoration: "underlined",
          cursor: "pointer"
        }}
      // onClick={() => setIsTextOpen(prev => !prev)}
      >
        ...Read {isTextOpen ? "Less" : "More"}
      </span>
    </BootstrapTooltip>
  </span>;
}

export default TruncatedText;
