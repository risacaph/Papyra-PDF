package stirling.software.SPDF.model.api.misc;

import io.swagger.v3.oas.annotations.media.Schema;

import lombok.Data;
import lombok.EqualsAndHashCode;

import stirling.software.SPDF.model.api.PDFWithPageNums;

@Data
@EqualsAndHashCode(callSuper = true)
public class AddQrCodeRequest extends PDFWithPageNums {

    @Schema(
            description = "The text or URL to encode in the QR code",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String content;

    @Schema(
            description =
                    "Position for the QR code based on a 1-9 grid (1=top-left, 2=top-center,"
                            + " 3=top-right, 4=middle-left, 5=middle-center, 6=middle-right,"
                            + " 7=bottom-left, 8=bottom-center, 9=bottom-right)",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED,
            defaultValue = "9",
            minimum = "1",
            maximum = "9")
    private Integer position = 9;

    @Schema(
            description = "Size of the QR code square, in PDF points",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED,
            defaultValue = "100",
            minimum = "20")
    private Integer size = 100;
}
