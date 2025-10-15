package dev.killua.dashboard.dto;

public class CommandResultDto {
    private int exit_code;
    private String output;

    public CommandResultDto() {}

    public CommandResultDto(int exit_code, String output) {
        this.exit_code = exit_code;
        this.output = output;
    }

    public int getExit_code() {
        return exit_code;
    }

    public void setExit_code(int exit_code) {
        this.exit_code = exit_code;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }
}
