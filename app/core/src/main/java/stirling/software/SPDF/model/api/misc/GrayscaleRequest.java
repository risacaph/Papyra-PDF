package stirling.software.SPDF.model.api.misc;

import io.swagger.v3.oas.annotations.media.Schema;

import lombok.Data;
import lombok.EqualsAndHashCode;

import stirling.software.common.model.api.PDFFile;

@Data
@EqualsAndHashCode(callSuper = true)
public class GrayscaleRequest extends PDFFile {

    @Schema(
            description = "Rendering resolution in DPI used to rasterize each page",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED,
            defaultValue = "300",
            minimum = "72")
    private Integer dpi = 300;
}
