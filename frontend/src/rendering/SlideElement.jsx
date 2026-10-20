import React from 'react';
import { getIconComponent } from '../data/iconLibrary';
import { MotionWidget } from '../components/MotionWidgets/MotionWidget';
import { canonicalElement } from './elementModel.js';
import { MotionFrameContext } from '../motion/core/MotionFrameContext';
import { normalizedCrop } from './imageModel.js';

// One SVG layout for the editing canvas, video preview and rendered frames.
export const renderSvgTextLines = ({
    text,
    x,
    y,
    width,
    height,
    fontSize = 20,
    fontFamily = 'Arial',
    fontWeight = 'normal',
    fontStyle = 'normal',
    color = '#0f172a',
    textAlign = 'left',
    verticalAlign = 'top',
    opacity = 1.0,
  }) => {
    if (!text) return null;

    const rawLines = String(text).split('\n');
    const avgCharWidth = fontSize * 0.55;
    const maxChars = width > 0 ? Math.max(6, Math.floor(width / avgCharWidth)) : 999;

    const lines = [];
    for (const rawLine of rawLines) {
      if (rawLine.length <= maxChars || maxChars >= 999) {
        lines.push(rawLine);
        continue;
      }
      const words = rawLine.split(' ');
      let curr = '';
      for (const word of words) {
        if (!curr) {
          curr = word;
        } else if ((curr + ' ' + word).length <= maxChars) {
          curr += ' ' + word;
        } else {
          lines.push(curr);
          curr = word;
        }
      }
      if (curr) lines.push(curr);
    }

    const lineHeight = fontSize * 1.25;
    const count = lines.length;

    let startY;
    if (verticalAlign === 'middle') {
      const centerY = y + height / 2;
      startY = centerY - ((count - 1) * lineHeight) / 2;
    } else if (verticalAlign === 'bottom') {
      startY = y + height - (count - 1) * lineHeight - fontSize * 0.5;
    } else {
      startY = y + fontSize * 0.6;
    }

    let textAnchor = 'start';
    let textX = x;
    if (textAlign === 'center') {
      textAnchor = 'middle';
      textX = x + width / 2;
    } else if (textAlign === 'right') {
      textAnchor = 'end';
      textX = x + width;
    }

    return (
      <text
        x={textX}
        y={startY}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fontStyle={fontStyle}
        fill={color}
        opacity={opacity}
        pointerEvents="none"
      >
        {lines.map((line, idx) => (
          <tspan
            key={idx}
            x={textX}
            y={startY + idx * lineHeight}
            dominantBaseline="central"
          >
            {line || '\u00A0'}
          </tspan>
        ))}
      </text>
    );
  };

export function SlideElement({ element, editing = false, isPreview = false }) {
    const el = canonicalElement(element);
    const strokeDash = el.stroke_style === 'dashed' ? '8 6' : undefined;
    const opacity = (el.opacity ?? 1) * (el._reveal_opacity ?? 1);

    switch (el.type) {
      case 'image': {
        const crop = normalizedCrop(el.image_crop);
        const w = el.image_width || 1, h = el.image_height || 1;
        return <g opacity={opacity} transform={el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined}>
          <g transform={`translate(${el.x} ${el.y})`}>
            <g transform={`translate(${el.flip_x ? el.width : 0} ${el.flip_y ? el.height : 0}) scale(${el.flip_x ? -1 : 1} ${el.flip_y ? -1 : 1})`}>
              <svg width={el.width} height={el.height} viewBox={`${crop.x * w} ${crop.y * h} ${crop.width * w} ${crop.height * h}`} preserveAspectRatio="none" overflow="hidden">
                <image href={el.image_src} width={w} height={h} preserveAspectRatio="none" style={{ filter: `brightness(${el.image_brightness ?? 100}%) contrast(${el.image_contrast ?? 100}%) saturate(${el.image_saturation ?? 100}%)` }} />
              </svg>
            </g>
          </g>
        </g>;
      }
      case 'rectangle':
        return (
          <g
            key={el.id}
            opacity={opacity}
            transform={el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined}
          >
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill={el.fill_color || el.fill || 'transparent'}
              stroke={el.stroke_color || el.stroke || 'transparent'}
              strokeWidth={el.stroke_width}
              strokeDasharray={strokeDash}
            />
            {renderSvgTextLines({
              text: el.text || el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.font_size || 18,
              fontFamily: el.font_family || 'Arial',
              fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
              fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
              color: el.text_color || el.font_color || '#ffffff',
              textAlign: el.text_align || 'center',
              verticalAlign: 'middle',
            })}
          </g>
        );

      case 'rounded_rectangle':
        return (
          <g
            key={el.id}
            opacity={opacity}
            transform={el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined}
          >
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              rx={el.radius !== undefined ? el.radius : 16}
              ry={el.radius !== undefined ? el.radius : 16}
              fill={el.fill_color || el.fill || 'transparent'}
              stroke={el.stroke_color || el.stroke || 'transparent'}
              strokeWidth={el.stroke_width}
              strokeDasharray={strokeDash}
            />
            {renderSvgTextLines({
              text: el.text || el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.font_size || 18,
              fontFamily: el.font_family || 'Arial',
              fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
              fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
              color: el.text_color || el.font_color || '#ffffff',
              textAlign: el.text_align || 'center',
              verticalAlign: 'middle',
            })}
          </g>
        );

      case 'ellipse':
        return (
          <g
            key={el.id}
            opacity={opacity}
            transform={el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined}
          >
            <ellipse
              cx={el.x + el.width / 2}
              cy={el.y + el.height / 2}
              rx={Math.max(1, el.width / 2)}
              ry={Math.max(1, el.height / 2)}
              fill={el.fill_color || el.fill || 'transparent'}
              stroke={el.stroke_color || el.stroke || 'transparent'}
              strokeWidth={el.stroke_width}
              strokeDasharray={strokeDash}
            />
            {renderSvgTextLines({
              text: el.text || el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.font_size || 18,
              fontFamily: el.font_family || 'Arial',
              fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
              fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
              color: el.text_color || el.font_color || '#ffffff',
              textAlign: el.text_align || 'center',
              verticalAlign: 'middle',
            })}
          </g>
        );

      case 'line':
      case 'arrow': {
        const x1 = el.x;
        const y1 = el.y;
        const x2 = el.x + el.width;
        const y2 = el.y + el.height;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 14;

        return (
          <g
            key={el.id}
            opacity={opacity}
            transform={el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined}
          >
            {/* Wider transparent hit area for easy clicking */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="transparent"
              strokeWidth={Math.max(16, el.stroke_width * 3)}
            />
            {/* Visual line */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={el.stroke_color || el.stroke || '#000000'}
              strokeWidth={el.stroke_width}
              strokeDasharray={strokeDash}
              strokeLinecap="round"
            />
            {/* Arrow end */}
            {(el.arrow_head_end || el.arrow_head === 'end' || el.arrow_head === 'both') && (
              <polygon
                points={`
                  ${x2},${y2} 
                  ${x2 - headLen * Math.cos(angle - Math.PI / 6)},${y2 - headLen * Math.sin(angle - Math.PI / 6)} 
                  ${x2 - headLen * Math.cos(angle + Math.PI / 6)},${y2 - headLen * Math.sin(angle + Math.PI / 6)}
                `}
                fill={el.stroke_color || el.stroke || '#000000'}
              />
            )}
            {/* Arrow start */}
            {(el.arrow_head_start || el.arrow_head === 'start' || el.arrow_head === 'both') && (
              <polygon
                points={`
                  ${x1},${y1} 
                  ${x1 + headLen * Math.cos(angle - Math.PI / 6)},${y1 + headLen * Math.sin(angle - Math.PI / 6)} 
                  ${x1 + headLen * Math.cos(angle + Math.PI / 6)},${y1 + headLen * Math.sin(angle + Math.PI / 6)}
                `}
                fill={el.stroke_color || el.stroke || '#000000'}
              />
            )}
          </g>
        );
      }

      case 'text': {
        const isEditing = editing;

        return (
          <g
            key={el.id}
            opacity={opacity}
            transform={el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined}
          >
            {/* Bounding box hit area */}
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill="transparent"
            />
            {!isEditing && renderSvgTextLines({
              text: el.text || el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.font_size || 20,
              fontFamily: el.font_family || 'Arial',
              fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
              fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
              color: el.text_color || el.font_color || '#0f172a',
              textAlign: el.text_align || 'left',
              verticalAlign: el.vertical_align ? el.vertical_align : (el.text_align === 'center' ? 'middle' : 'top'),
            })}
          </g>
        );
      }

      case 'icon': {
        const IconComponent = getIconComponent(el.icon_name);
        const badgeStyle = el.icon_badge || 'none';
        const badgeFill = el.badge_color || el.fill_color || el.fill || 'transparent';
        const iconColor = el.icon_color || el.stroke_color || el.stroke || el.text_color || '#38bdf8';
        const labelText = el.text || el.content || '';

        const labelFontSize = el.font_size ? el.font_size * 0.75 : 14;
        const badgeH = labelText ? Math.max(24, el.height - labelFontSize * 1.6) : el.height;
        const iconSize = Math.max(16, Math.min(el.width, badgeH) * 0.58);
        const iconX = el.x + (el.width - iconSize) / 2;
        const iconY = el.y + (badgeH - iconSize) / 2;

        return (
          <g
            key={el.id}
            opacity={opacity}
            transform={el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined}
          >
            {/* Optional Badge */}
            {badgeStyle === 'circle' && (
              <ellipse
                cx={el.x + el.width / 2}
                cy={el.y + badgeH / 2}
                rx={Math.max(1, Math.min(el.width, badgeH) / 2)}
                ry={Math.max(1, Math.min(el.width, badgeH) / 2)}
                fill={badgeFill}
                stroke={el.stroke_color || el.stroke || 'transparent'}
                strokeWidth={el.stroke_width || 0}
              />
            )}
            {badgeStyle === 'rounded' && (
              <rect
                x={el.x}
                y={el.y}
                width={el.width}
                height={badgeH}
                rx={Math.min(16, el.width * 0.25)}
                ry={Math.min(16, el.width * 0.25)}
                fill={badgeFill}
                stroke={el.stroke_color || el.stroke || 'transparent'}
                strokeWidth={el.stroke_width || 0}
              />
            )}
            {badgeStyle === 'none' && badgeFill !== 'transparent' && (
              <rect
                x={el.x}
                y={el.y}
                width={el.width}
                height={badgeH}
                fill={badgeFill}
              />
            )}

            {/* SVG Icon embedded via foreignObject */}
            <foreignObject
              x={iconX}
              y={iconY}
              width={iconSize}
              height={iconSize}
              className="pointer-events-none overflow-visible"
            >
              <div
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: iconColor,
                }}
              >
                <IconComponent size={iconSize} color={iconColor} strokeWidth={2} />
              </div>
            </foreignObject>

            {/* Subtitle / Caption text underneath */}
            {labelText &&
              renderSvgTextLines({
                text: labelText,
                x: el.x,
                y: el.y + badgeH + 4,
                width: el.width,
                height: el.height - badgeH,
                fontSize: labelFontSize,
                fontFamily: el.font_family || 'Arial',
                fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
                fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
                color: el.text_color || el.font_color || '#ffffff',
                textAlign: 'center',
                verticalAlign: 'top',
              })}
          </g>
        );
      }

      case 'motion_component': {
        return (
          <g
            key={el.id}
            opacity={opacity}
            transform={el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined}
          >
            <foreignObject
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              className="overflow-visible"
              style={{ pointerEvents: 'none' }}
            >
              <div 
                style={{ 
                  width: `${el.width}px`, 
                  height: `${el.height}px`,
                  pointerEvents: 'auto',
                }}
              >
                <MotionFrameContext.Provider value={el.motion_frame ?? null}>
                  <MotionWidget element={el} isPreview={isPreview} />
                </MotionFrameContext.Provider>
              </div>
            </foreignObject>
          </g>
        );
      }

      default:
        return null;
    }
  };

