import React, { type ReactNode } from 'react'
import { CanvasItem, TextLabel, VectorSegment, type ThemeMode, type ToneName } from 'vizmatic'
import { kit } from './figure-kit'
export function quantityKit(theme: ThemeMode, height: number) {
 const k=kit(theme)
 const label=(id:string,x:number,y:number,value:string,w:number,tone:ToneName='neutral',size=26,mono=false,bold=false,align:'left'|'center'|'right'='left')=>{
  const el=TextLabel({c:k.c,text:value,color:k.ink(tone),fontSize:size,fontWeight:bold?600:400,mono,width:w,align}) as React.ReactElement<{style?:React.CSSProperties}>
  return <CanvasItem key={id} x={x} y={y} width={w} height={46}>{React.cloneElement(el,{style:{...el.props.style,whiteSpace:'nowrap',overflowWrap:'normal'}})}</CanvasItem>
 }
 const vector=(id:string,left:number,y:number,right:number,bottom:number,children:ReactNode)=>{
  const x0=Math.max(0,Math.floor(left)),y0=Math.max(0,Math.floor(y)),w=Math.min(700,Math.ceil(right))-x0,h=Math.min(height,Math.ceil(bottom))-y0
  return w<=0||h<=0?null:<CanvasItem key={id} x={x0} y={y0} width={w} height={h}><svg width={w} height={h} viewBox={`${x0} ${y0} ${w} ${h}`}>{children}</svg></CanvasItem>
 }
 const rect=(id:string,x:number,y:number,w:number,h:number,color:string,role='mark')=>w<=0||h<=0?null:vector(id,x-4,y-4,x+w+4,y+h+4,<rect data-paint-role={role} data-interval={id} x={x} y={y} width={w} height={h} fill={color}/>)
 const solid=(id:string,x:number,y:number,w:number,h:number,tone:ToneName='blue')=>rect(id,x,y,w,h,k.ink(tone))
 const open=(id:string,x:number,y:number,w:number,h:number,tone:ToneName='blue',left=true,right=true)=>w<=0?null:<React.Fragment key={id}>{rect(id+'-surface',x,y,w,h,k.c.bgCard,'surface')}{solid(id+'-upper',x+(left?0:4),y,Math.max(0,w-(left?0:4)-(right?0:4)),2,tone)}{solid(id+'-lower',x+(left?0:4),y+h-2,Math.max(0,w-(left?0:4)-(right?0:4)),2,tone)}{left&&solid(id+'-left',x,y,2,h,tone)}{right&&solid(id+'-right',x+w-2,y,2,h,tone)}</React.Fragment>
 const svg=(id:string,x:number,y:number,w:number,h:number,children:ReactNode)=>w<=0||h<=0?null:<CanvasItem key={id} x={x} y={y} width={w} height={h}><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{children}</svg></CanvasItem>
 const segment=(id:string,x1:number,y1:number,x2:number,y2:number,tone:ToneName='neutral',stroke=3)=>{
  const g=VectorSegment({x1,y1,x2,y2,color:k.ink(tone),strokeWidth:stroke,showEndDot:false}) as React.ReactElement<{children?:ReactNode}>
  return vector(id,Math.min(x1,x2)-16,Math.min(y1,y2)-16,Math.max(x1,x2)+16,Math.max(y1,y2)+16,React.cloneElement(g,{},React.Children.map(g.props.children,c=>React.isValidElement(c)&&c.type==='line'?React.cloneElement(c as React.ReactElement<Record<string,unknown>>,{strokeLinecap:'butt'}):c)))
 }
 const hatch=(id:string,x:number,y:number,w:number,h:number,tone:ToneName='critical')=>{
  if(w<=8||h<=8)return null
  const lines:ReactNode[]=[]
  for(let d=-h;d<w;d+=14){const x1=Math.max(4,d),y1=h-4-Math.max(0,4-d),x2=Math.min(w-4,d+h-8),y2=4+Math.max(0,d+h-8-(w-4));if(x2>x1&&y1>y2)lines.push(<line key={d} x1={x+x1} y1={y+y1} x2={x+x2} y2={y+y2} stroke={k.ink(tone)} strokeWidth={2} strokeLinecap="butt"/>)}
  return vector(id,x-4,y-4,x+w+4,y+h+4,lines)
 }
 const dot=(id:string,x:number,y:number,r:number,tone:ToneName='blue')=>vector(id,x-r-4,y-r-4,x+r+4,y+r+4,<circle cx={x} cy={y} r={r} fill={k.ink(tone)}/>)
 const ring=(id:string,x:number,y:number,r:number,tone:ToneName='neutral')=>vector(id,x-r-4,y-r-4,x+r+4,y+r+4,<circle cx={x} cy={y} r={r} fill={k.c.bgCard} stroke={k.ink(tone)} strokeWidth={2}/>)
 return {...k,label,rect,solid,open,svg,segment,hatch,dot,ring,root:(children:ReactNode)=>k.root(700,height,children)}
}
