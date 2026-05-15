type XAxisTickProps = { x?: number; y?: number; payload?: { value: string } };

export function ArabicXAxisTick(props: XAxisTickProps) {
  if (props.x == null || props.y == null || !props.payload) return null;
  return (
    <foreignObject x={props.x - 65} y={props.y - 2} width="130" height="28" style={{ overflow: "visible" }}>
      <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: 11, color: "#6B7280", textAlign: "right", direction: "rtl", width: "100%", whiteSpace: "nowrap" }}>
        {props.payload.value}
      </div>
    </foreignObject>
  );
}

export type { XAxisTickProps };
