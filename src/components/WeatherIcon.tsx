import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Snowflake,
} from 'lucide-react';
import { getWeatherCondition } from '../utils/weatherCodes';

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  code,
  isDay = true,
  className = 'w-6 h-6',
  size,
}) => {
  const info = getWeatherCondition(code, isDay);

  const iconProps = {
    className: `${info.color} ${className}`,
    ...(size ? { size } : {}),
  };

  switch (info.icon) {
    case 'sun':
      return <Sun {...iconProps} />;
    case 'moon':
      return <Moon {...iconProps} />;
    case 'cloud-sun':
      return <CloudSun {...iconProps} />;
    case 'cloud-moon':
      return <CloudMoon {...iconProps} />;
    case 'cloud':
      return <Cloud {...iconProps} />;
    case 'cloud-fog':
      return <CloudFog {...iconProps} />;
    case 'cloud-drizzle':
      return <CloudDrizzle {...iconProps} />;
    case 'cloud-rain':
      return <CloudRain {...iconProps} />;
    case 'cloud-snow':
      return <CloudSnow {...iconProps} />;
    case 'cloud-lightning':
      return <CloudLightning {...iconProps} />;
    case 'snowflake':
      return <Snowflake {...iconProps} />;
    default:
      return <CloudSun {...iconProps} />;
  }
};
