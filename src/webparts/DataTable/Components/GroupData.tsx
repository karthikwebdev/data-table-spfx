import React, { useEffect, useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

interface Props {
    data:any,
    columns:any,
    index:number,
    isExpandAllEnabled:boolean
}

interface RenderAccordianProps{
    isExpandAllEnabled: boolean,
    item:string,
    columns:any,
    index:number,
    data:any
}

const RenderAccordian = (props:RenderAccordianProps) => {
    const { isExpandAllEnabled,item,columns,index,data } = props
    const [openAccordian, setOpenAccordian] = useState<boolean>(false);

    useEffect(() => {
        setOpenAccordian(isExpandAllEnabled)
    }, [isExpandAllEnabled])

    return (
        <Accordion expanded={openAccordian} onChange={() => setOpenAccordian(prev => !prev)} >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`Panel-header-${item}`}
                id={"panel-header" + item}
            >
                <Typography ><span style={{ color: "#009be5", fontWeight: 900 }} > {columns[index].label}: </span> {"  "}{!!columns[index].render ? columns[index].render(item, columns[index].secondParameter) : item}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <div
                    style={{
                        width: "100%"
                    }}
                >
                    <GroupData data={data[item]} columns={columns} index={index + 1} isExpandAllEnabled={isExpandAllEnabled} />
                </div>
            </AccordionDetails>
        </Accordion>
    )
}

function GroupData( props:Props ) {
    const { data, columns, index, isExpandAllEnabled }  = props

    if(Array.isArray(data)){
        return (
            <Table size="small" aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        {
                             columns.slice(index,columns.length).map((column:any) => {
                                return (
                                    <TableCell> { column.label } </TableCell>
                                )
                            })
                        }
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.orderId}>
                            {
                                columns.slice(index, columns.length).map((column:any) => (
                                    <TableCell component="th" scope="row">
                                        {!!column.render ? column.render(row[column["id"]], column.secondParameter) : row[column["id"]]}
                                    </TableCell>
                                ))
                            }                            
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            )
    }
    return (
        <>
            {
                Object.keys(data).map(key => 
                      <RenderAccordian key={key} item={key} columns={columns} index={index} data={data} isExpandAllEnabled={isExpandAllEnabled} />
                )
            }
        </>
    )
}

export default GroupData
